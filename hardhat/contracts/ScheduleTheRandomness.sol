//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";
import {OpsReady} from "./gelato/OpsReady.sol";
import {IOps} from "./gelato/IOps.sol";

import "witnet-solidity-bridge/contracts/interfaces/IWitnetRandomness.sol";

import "@api3/airnode-protocol/contracts/rrp/requesters/RrpRequesterV0.sol";

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

enum CONTROL_STATUS {
  STILL,
  CHECKING,
  CHECKED
}

struct QUALITY_CONTROL {
  uint256 id;
  uint256 employeeId;
  uint8[] checked;
  uint8 controlType;
}

struct COMPONENT {
  uint256 timestamp;
  uint8 id;
  CONTROL_STATUS status;
}

contract ScheduleTheRandomness is
  OpsReady,
  RrpRequesterV0,
  VRFConsumerBaseV2,
  Ownable
{
  // #region ======  CONTRACT STATE & EVENTS ===================

  uint256 intervalComponents = 3600; // minimum interval between control twice the same component

  mapping(uint8 => COMPONENT) public components; /// mapping with current state of the components

  uint8[] toCheckComponents; // helper array to be built dynamically with the available controls to check

  bytes32 qualityPlanTaskId; // Gelato TaskId to stop the quality plan

  bool public planIsActive = false; // Quality plan running or stopped

  uint256 public controlId; // control number

  mapping(uint256 => QUALITY_CONTROL) public controls; // Storage of all controls

  CONTROL_STATUS public status; // Current Status od the Control

  uint256 public lastLaunched;

  //// Events

  event qualityControlStart();

  event randomComponent(uint8 id);

  event controlTypeAvailable();

  event qualityControlDone();

  // #endregion ======  CONTRACT STATE ================

  // #region ======  CHAINLINK VRF STATE ================
  VRFCoordinatorV2Interface COORDINATOR;
  // Your subscription ID.
  uint64 s_subscriptionId;

  // Goerli coordinator. For other networks,
  // see https://docs.chain.link/docs/vrf-contracts/#configurations
  address vrfCoordinator = address(0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D);

  // The gas lane to use, which specifies the maximum gas price to bump to.
  // For a list of available gas lanes on each network,
  // see https://docs.chain.link/docs/vrf-contracts/#configurations
  bytes32 keyHash =
    0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15;

  // Depends on the number of requested values that you want sent to the
  // fulfillRandomWords() function. Storing each word costs about 20,000 gas,
  // so 100,000 is a safe default for this example contract. Test and adjust
  // this limit based on the network that you select, the size of the request,
  // and the processing of the callback request in the fulfillRandomWords()
  // function.
  uint32 callbackGasLimit = 100000;

  // The default is 3, but you can set this higher.
  uint16 requestConfirmations = 3;

  // For this example, retrieve 2 random values in one request.
  // Cannot exceed VRFCoordinatorV2.MAX_NUM_WORDS.
  uint32 numWords = 1;

  uint256 public employeeId;
  uint256 public s_requestId;
  address s_owner;

  // #endregion ======  CHAINLINK VRF STATE ================

  // #region ====== WITNET RANDOMNESS CONTRACT STATE ================

  uint32 public randomness;
  uint256 public latestRandomizingBlock;
  mapping(uint256 => bytes32) public taskIdByBlock;
  IWitnetRandomness witnet;
  // #endregion ====== WITNET RANDOMNESS CONTRACT STATE ================

  // #region ====== API3 QRNG STATE ================
  event RequestedUint256Array(bytes32 indexed requestId, uint256 size);
  event ReceivedUint256Array(bytes32 indexed requestId, uint256[] response);

  mapping(bytes32 => bool) public expectingRequestWithIdToBeFulfilled;

  address public airnode;
  bytes32 public endpointIdUint256Array;
  address public sponsorWallet;

  uint256[] public qrngUint256Array;

  // #endregion ====== API3 QRNG STATE ================

  constructor(
    address payable _ops,
    IWitnetRandomness _witnetRandomness,
    address _airnodeRrp,
    uint64 subscriptionId
  )
    OpsReady(_ops)
    RrpRequesterV0(_airnodeRrp)
    VRFConsumerBaseV2(vrfCoordinator)
  {
    witnet = _witnetRandomness;

    COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);

    s_owner = msg.sender;
    s_subscriptionId = subscriptionId;

    for (uint8 i = 1; i <= 20; i++) {
      COMPONENT memory compo = COMPONENT(
       0,
        i,
        CONTROL_STATUS.STILL
      );
      components[i] = compo;
    }
  }

  // #region ========= STEP 1 GELATO MASTER OF CEREMONY ==============

  function startQualityPlan() public {
    require(
      planIsActive == false && qualityPlanTaskId == bytes32(0),
      "PLAN_RUNNING"
    );
    planIsActive = true;
    createQualityPlanTask();
  }

  function stopQualityControl() public {
    require(planIsActive == true && qualityPlanTaskId != bytes32(0), "NO_PLAN");

    IOps(ops).cancelTask(qualityPlanTaskId);
    qualityPlanTaskId = bytes32(0);
    planIsActive = false;
    if (taskIdByBlock[latestRandomizingBlock] != bytes32(0)) {
    cancelQualityTypeByID(taskIdByBlock[latestRandomizingBlock]);
    }


  }

  function createQualityPlanTask() public {
    bytes32 taskId = IOps(ops).createTimedTask(
      0,
      900,
      address(this),
      this.doQualityControl.selector,
      address(this),
      abi.encodeWithSelector(this.checkQualityPlanIsActive.selector),
      ETH,
      false
    );
    qualityPlanTaskId = taskId;
  }

  function checkQualityPlanIsActive()
    public
    view
    returns (bool canExec, bytes memory execPayload)
  {
    canExec = planIsActive == true && status == CONTROL_STATUS.STILL;

    execPayload = abi.encodeWithSelector(this.doQualityControl.selector);
  }

  function doQualityControl() public {
    /// Check Controlled components
    require(planIsActive == true, "NO_PLAN_ACTIVE");

    require(status == CONTROL_STATUS.STILL, "STILL_RUNNING_PREVIOUS_CONTROL");

    emit qualityControlStart();

    status = CONTROL_STATUS.CHECKING;

    lastLaunched = block.timestamp;  

    controlId = controlId + 1;

    controls[controlId].id = controlId;

    uint256 fee;
    address feeToken;

    (fee, feeToken) = IOps(ops).getFeeDetails();

    _transfer(fee, feeToken);

    uint8[2] memory retArray = getRandomComponents();

    for (uint256 i = 0; i < 2; i++) {
      uint8 compoIndex = retArray[i];
      COMPONENT storage compo = components[compoIndex];
      compo.status = CONTROL_STATUS.CHECKING;
      compo.timestamp = block.timestamp;
    }

    /// Store Quality Control Details
    for (uint8 i = 1; i <= 20; i++) {
      COMPONENT memory _compo = components[i];
      if (
        _compo.status == CONTROL_STATUS.CHECKED ||
        _compo.status == CONTROL_STATUS.CHECKING
      ) {
        controls[controlId].checked.push(i);
      }
    }

    getRandomControlType();
  }

  function getRandomComponents() public returns (uint8[2] memory retArray) {
    for (uint8 i = 1; i <= 20; i++) {
      COMPONENT storage _compo = components[i];
      if (
        block.timestamp - _compo.timestamp > intervalComponents &&
        _compo.status == CONTROL_STATUS.CHECKED
      ) {
        _compo.status = CONTROL_STATUS.STILL;
      } else if (_compo.status == CONTROL_STATUS.STILL) {
        toCheckComponents.push(_compo.id);
      }
    }

    makeRequestAPI3RandomComponents(2);

    for (uint256 i = 0; i < 2; i++) {
      uint256 toCheckLength = toCheckComponents.length;
      uint8 rand = uint8((qrngUint256Array[i] % 20) + 1);
      uint8 id = toCheckComponents[rand];
      emit randomComponent(id);
      retArray[i] = id;
      toCheckComponents[rand] = toCheckComponents[toCheckLength - 1];
      toCheckComponents.pop();
    }
  }

  // #endregion ========= STEP1  GELATO MASTER OF CEREMONY ==============

  // #region ========= STEP 2 GET RANDOM COMPONENTS WITH API3

  /// @notice Sets parameters used in requesting QRNG services
  /// @dev No access control is implemented here for convenience. This is not
  /// secure because it allows the contract to be pointed to an arbitrary
  /// Airnode. Normally, this function should only be callable by the "owner"
  /// or not exist in the first place.
  /// @param _airnode Airnode address
  /// @param _endpointIdUint256Array Endpoint ID used to request a `uint256[]`
  /// @param _sponsorWallet Sponsor wallet address
  function setRequestParameters(
    address _airnode,
    bytes32 _endpointIdUint256Array,
    address _sponsorWallet
  ) external {
    // Normally, this function should be protected, as in:
    // require(msg.sender == owner, "Sender not owner");
    airnode = _airnode;
    endpointIdUint256Array = _endpointIdUint256Array;
    sponsorWallet = _sponsorWallet;
  }

  /// @notice Requests a `uint256[]`
  /// @param size Size of the requested array
  function makeRequestAPI3RandomComponents(uint256 size) public {
    qrngUint256Array = [0, 0];
    bytes32 requestId = airnodeRrp.makeFullRequest(
      airnode,
      endpointIdUint256Array,
      address(this),
      sponsorWallet,
      address(this),
      this.fulfillRandomComponents.selector,
      // Using Airnode ABI to encode the parameters
      abi.encode(bytes32("1u"), bytes32("size"), size)
    );
    //  uint256 requestId = 123;
    expectingRequestWithIdToBeFulfilled[requestId] = true;
  }

  /// @notice Called by the Airnode through the AirnodeRrp contract to
  /// fulfill the request
  /// @param requestId Request ID
  /// @param data ABI-encoded response
  function fulfillRandomComponents(bytes32 requestId, bytes calldata data)
    external
    onlyAirnodeRrp
  {
    require(
      expectingRequestWithIdToBeFulfilled[requestId],
      "Request ID not known"
    );
    expectingRequestWithIdToBeFulfilled[requestId] = false;
    qrngUint256Array = abi.decode(data, (uint256[]));
  }

  // #endregion STEP 2 GET RANDOM COMPONENTS WITH API3

  // #region ========= STEP 3 GET CONTROL TYPE WITH WITNET

  function getRandomControlType() public returns (uint8 _controlType) {
    latestRandomizingBlock = block.number;
    uint256 _usedFunds = witnet.randomize{value: 0.1 ether}();

    if (taskIdByBlock[latestRandomizingBlock] == bytes32(0)) {
      createTaskQualityControl();
    }
  }

  function createTaskQualityControl() public {
    bytes32 taskId = IOps(ops).createTaskNoPrepayment(
      address(this),
      this.qualityControlDelivered.selector,
      address(this),
      abi.encodeWithSelector(this.checkerIsRandomized.selector),
      ETH
    );

    taskIdByBlock[latestRandomizingBlock] = taskId;
  }

  function checkerIsRandomized()
    public
    view
    returns (bool canExec, bytes memory execPayload)
  {
    canExec = isRandomnize();

    execPayload = abi.encodeWithSelector(this.qualityControlDelivered.selector);
  }

  function isRandomnize() public view returns (bool ready) {
    ready = witnet.isRandomized(latestRandomizingBlock);
  }

  function cancelQualityTypeByID(bytes32 _taskId) public {
    IOps(ops).cancelTask(_taskId);
    taskIdByBlock[latestRandomizingBlock] = bytes32(0);
  }

  function qualityControlDelivered() external onlyOps {
    assert(latestRandomizingBlock > 0);
    randomness = 1 + witnet.random(3, 0, latestRandomizingBlock);

    uint256 fee;
    address feeToken;

    (fee, feeToken) = IOps(ops).getFeeDetails();

    _transfer(fee, feeToken);

    cancelQualityTypeByID(taskIdByBlock[latestRandomizingBlock]);

    controls[controlId].controlType = uint8(randomness);

    for (uint8 i = 1; i <= 20; i++) {
      COMPONENT storage _compo = components[i];
      if (_compo.status == CONTROL_STATUS.CHECKING) {
        _compo.status = CONTROL_STATUS.CHECKED;
      }
    }

    emit controlTypeAvailable();

    requestEmployeByChainlink();
  }

  //  #endregion STEP 3 GET CONTROL TYPE WITH WITNET

  // region =========  STEP 4 GET EMPLOYEEID with CHAINLINK VRF

  // Assumes the subscription is funded sufficiently.
  function requestEmployeByChainlink() public {
    // Will revert if subscription is not set and funded.
    s_requestId = COORDINATOR.requestRandomWords(
      keyHash,
      s_subscriptionId,
      requestConfirmations,
      callbackGasLimit,
      numWords
    );
  }

  function fulfillRandomWords(
    uint256, /* requestId */
    uint256[] memory randomWords
  ) internal override {
    employeeId = randomWords[0] & (500 + 1);
    controls[controlId].employeeId = employeeId;
    status = CONTROL_STATUS.STILL;

    emit qualityControlDone();
  }

  // endregion STEP 4 GET EMPLOYEEID with CHAINLINK VRF

  function getLastControlId() external returns (uint256) {
    if (controlId == 0) {
      return 0;
    } else if (status == CONTROL_STATUS.STILL) {
      return controlId;
    } else {
      return controlId - 1;
    }
  }

  receive() external payable {}

  function withdrawContract() external onlyOwner returns (bool) {
    (bool result, ) = payable(msg.sender).call{value: address(this).balance}(
      ""
    );
    return result;
  }
}
