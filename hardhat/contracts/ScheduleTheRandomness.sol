//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";
import {OpsReady} from "./gelato/OpsReady.sol";
import {IOps} from "./gelato/IOps.sol";

import "witnet-solidity-bridge/contracts/interfaces/IWitnetRandomness.sol";

import "@api3/airnode-protocol/contracts/rrp/requesters/RrpRequesterV0.sol";


///0x6c3224f9b3fee000a444681d5d45e4532d5ba531

contract ScheduleTheRandomness is OpsReady, RrpRequesterV0, Ownable {
  
  ////  WITNET
  uint32 public randomness;
  uint256 public latestRandomizingBlock;
  mapping(uint256 => bytes32) public taskIdByBlock;
  IWitnetRandomness witnet;

  //// API3
  event RequestedUint256Array(bytes32 indexed requestId, uint256 size);
  event ReceivedUint256Array(bytes32 indexed requestId, uint256[] response);

  address public airnode;
  bytes32 public endpointIdUint256;
  bytes32 public endpointIdUint256Array;
  address public sponsorWallet;

  uint256[] public qrngUint256Array;

  mapping(bytes32 => bool) public expectingRequestWithIdToBeFulfilled;

  constructor(address payable _ops, IWitnetRandomness _witnetRandomness, address _airnodeRrp)
    OpsReady(_ops) RrpRequesterV0(_airnodeRrp) 
  {
    witnet = _witnetRandomness;
  }

  // ============= ============= Create Simple Task with NO Prepayment Use Case Business Logic  ============= ============= //
  // #region Create Simple Task With NO Prepayment Use Case Business Logic

  /**************************************************************************
   * Create Simple Task With NO Prepayment Use Case Business Logic
   * The difference with the simple create task is we will transfer the execution gas fees
   * at the time of execution, for that we will require our contract to hold balance
   *
   * Step 1 : createTaskNoPrepayment()
   *          - requiere the contract to have funds or to receive funds
   *          - will create the task, we add ETH as the feetoken
   *          - will store the taskId
   *
   * Step 2 : checkerNoPrepayment() Function.
   *          - Check If the task can be executed , in this case if we do not have headache
   *          - returns the execPayload of startPartyNoPrepayment()
   *
   * Step 3 : Executable Function: startPartyNoPrepayment()
   *          - get Fee Details and transfer the requiered funds to Gelato
   *          - will Start the party setting lastPartyStart to block.timestamp
   *          - will cause a headache
   *************************************************************************/

  function exetest() external onlyOps (){
      uint256 fee;
    address feeToken;

    (fee, feeToken) = IOps(ops).getFeeDetails();

    _transfer(fee, feeToken);
      cancelTaskById(taskIdByBlock[latestRandomizingBlock]);
  }

  function createTaskFullfillRandomness() public  {
 
    bytes32 taskId = IOps(ops).createTaskNoPrepayment(
      address(this),
      this.fulfillRandomness.selector,
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

    execPayload = abi.encodeWithSelector(this.fulfillRandomness.selector);
  }


  receive() external payable {}

  function getRandomNumber() public payable {
    latestRandomizingBlock = block.number;
    uint256 _usedFunds = witnet.randomize{value: msg.value}();
    if (_usedFunds < msg.value) {
      payable(msg.sender).transfer(msg.value - _usedFunds);
    }
    if (taskIdByBlock[latestRandomizingBlock] == bytes32(0)) {
      createTaskFullfillRandomness();
    }
  }

  function fulfillRandomness() external onlyOps {
    assert(latestRandomizingBlock > 0);
    randomness = 1 + witnet.random(10, 0, latestRandomizingBlock);

    uint256 fee;
    address feeToken;

    (fee, feeToken) = IOps(ops).getFeeDetails();

    _transfer(fee, feeToken);

    cancelTaskById(taskIdByBlock[latestRandomizingBlock]);
  }

  function isRandomnize() public view returns (bool ready) {
    ready = witnet.isRandomized(latestRandomizingBlock);
  }

  function cancelTaskById(bytes32 _taskId) public {
    IOps(ops).cancelTask(_taskId);
    taskIdByBlock[latestRandomizingBlock] = bytes32(0);
  }

  function withdrawContract() external onlyOwner returns (bool) {
    (bool result, ) = payable(msg.sender).call{value: address(this).balance}(
      ""
    );
    return result;
  }


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
    function makeRequestUint256Array(uint256 size) external {
        bytes32 requestId = airnodeRrp.makeFullRequest(
            airnode,
            endpointIdUint256Array,
            address(this),
            sponsorWallet,
            address(this),
            this.fulfillUint256Array.selector,
            // Using Airnode ABI to encode the parameters
            abi.encode(bytes32("1u"), bytes32("size"), size)
        );
      //  uint256 requestId = 123;
        expectingRequestWithIdToBeFulfilled[requestId] = true;
        emit RequestedUint256Array(requestId, size);
    }

    /// @notice Called by the Airnode through the AirnodeRrp contract to
    /// fulfill the request
    /// @param requestId Request ID
    /// @param data ABI-encoded response
    function fulfillUint256Array(bytes32 requestId, bytes calldata data)
        external
          onlyAirnodeRrp
    {
        require(
            expectingRequestWithIdToBeFulfilled[requestId],
            "Request ID not known"
        );
        expectingRequestWithIdToBeFulfilled[requestId] = false;
        qrngUint256Array = abi.decode(data, (uint256[]));
        // Do what you want with `qrngUint256Array` here...
        emit ReceivedUint256Array(requestId, qrngUint256Array);
    }

}
