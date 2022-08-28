//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";
import {OpsReady} from "./gelato/OpsReady.sol";
import {IOps} from "./gelato/IOps.sol";

import "witnet-solidity-bridge/contracts/interfaces/IWitnetRandomness.sol";

contract WITNET_ScheduleTheRandomness is
  OpsReady,
  Ownable
{
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
 
  }

  //  #endregion STEP 3 GET CONTROL TYPE WITH WITNET

}
