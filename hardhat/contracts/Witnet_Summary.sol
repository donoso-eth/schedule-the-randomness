//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";
import {OpsReady} from "./gelato/OpsReady.sol";
import {IOps} from "./gelato/IOps.sol";

import "witnet-solidity-bridge/contracts/interfaces/IWitnetRandomness.sol";


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

  // #region ====== WITNET RANDOMNESS CONTRACT STATE ================

  uint32 public randomness;
  uint256 public latestRandomizingBlock;
  mapping(uint256 => bytes32) public taskIdByBlock;
  IWitnetRandomness witnet;
  // #endregion ====== WITNET RANDOMNESS CONTRACT STATE ================


  constructor(
    address payable _ops,
    IWitnetRandomness _witnetRandomness
  )
    OpsReady(_ops)
  {
    witnet = _witnetRandomness;

  }


  // #region ========= STEP 3 GET CONTROL TYPE WITH WITNET

  // Random numbers request
  function getRandomControlType() public returns (uint8 _controlType) {
    latestRandomizingBlock = block.number;
    uint256 _usedFunds = witnet.randomize{value: 0.1 ether}();

    if (taskIdByBlock[latestRandomizingBlock] == bytes32(0)) {
      createTaskQualityControl();
    }
  }

  // Gelato Task to check whether the random mumber is available under checkerIsRandomized()
  // and then execute qualityControlDelivered()
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

  // Check if random number is delivered
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

  // Cancel the task as we will require every time only one execution
  function cancelQualityTypeByID(bytes32 _taskId) public {
    IOps(ops).cancelTask(_taskId);
    taskIdByBlock[latestRandomizingBlock] = bytes32(0);
  }

  // Custome logic to be executed
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

 
  }

  //  #endregion STEP 3 GET CONTROL TYPE WITH WITNET

}
