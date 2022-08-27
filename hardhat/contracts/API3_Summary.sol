//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

import "@api3/airnode-protocol/contracts/rrp/requesters/RrpRequesterV0.sol";



contract ScheduleTheRandomness is
  RrpRequesterV0

{

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

    address _airnodeRrp,
    uint64 subscriptionId
  )
    RrpRequesterV0(_airnodeRrp)
  {
  }

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
    airnode = _airnode;
    endpointIdUint256Array = _endpointIdUint256Array;
    sponsorWallet = _sponsorWallet;
  }

  /// @notice Requests a `uint256[]`
  /// @param size Size of the requested array
  function makeRequestAPI3RandomComponents(uint256 size) public {
    qrngUint256Array = [0, 0];
    bytes32 requestId = airnodeRrp.makeFullRequest(
      airnode, //// airnode provider
      endpointIdUint256Array, /// type of 
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

 
}
