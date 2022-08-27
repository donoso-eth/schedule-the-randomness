/* eslint-disable @typescript-eslint/no-explicit-any */
import { Signer } from '@ethersproject/abstract-signer';
import { expect } from 'chai';

import {

  IOps,
  IOps__factory,
  ScheduleTheRandomness,
  ScheduleTheRandomness__factory,

} from '../typechain-types';

import * as hre from 'hardhat';

import { ethers } from 'hardhat';
import { JsonRpcProvider } from '@ethersproject/providers';
import { formatEther, parseEther } from 'ethers/lib/utils';
import { getValues } from './utils';


const gelatoAddress = '0x683913B3A32ada4F8100458A3E1675425BdAa7DF';
const ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const FIVE_MINUTES = 5 * 60;
const FEETOKEN = hre.ethers.constants.AddressZero;

let GELATO_OPS = '0xc1C6805B857Bef1f412519C4A842522431aFed39';

let ops: IOps;

let scheduleApp: ScheduleTheRandomness;
let deployer: Signer;
let deployerAddress: string;

let executor: any;
let executorAddress: string;

let interval: number;
let execAddress: string;
let execSelector: string;
let execData: string;
let resolverAddress: string;
let resolverData: string;
let taskId: string;
let resolverHash: string;

let provider: JsonRpcProvider;

describe('Party app Tests', function () {
  before(async function () {
    provider = ethers.provider;

    [deployer] = await ethers.getSigners();
    deployerAddress = await deployer.getAddress();

    scheduleApp = await new  ScheduleTheRandomness__factory(deployer).deploy(
       GELATO_OPS,
        "0x6Eb87EcCe6218Cd0e97299331D2aa5d2e53da5cD",
        '0xa0AD79D995DdeeB18a14eAef56A549A04e3Aa1Bd',
        449
    );

    ops = IOps__factory.connect(GELATO_OPS, deployer);



    executorAddress = gelatoAddress;

    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [executorAddress],
    });

    executor = await ethers.provider.getSigner(executorAddress);
  });



  it('it should start the quality plan', async () => {
     await scheduleApp.doQualityControl()
    let values = await getValues(scheduleApp)
    console.log(values);

  });

//   it('it should create a task ans stored correctly the taskid', async () => {
//     await scheduleApp.createTask();

//     execData = await scheduleApp.interface.encodeFunctionData('startParty');
//     execAddress = scheduleApp.address;
//     execSelector = await ops.getSelector('startParty()');
//     resolverAddress = scheduleApp.address;
//     resolverData = await scheduleApp.interface.encodeFunctionData(
//       'checkerStartParty'
//     );

//     resolverHash = ethers.utils.keccak256(
//       new ethers.utils.AbiCoder().encode(
//         ['address', 'bytes'],
//         [resolverAddress, resolverData]
//       )
//     );

//     taskId = await ops.getTaskId(
//       scheduleApp.address,
//       execAddress,
//       execSelector,
//       true,
//       ethers.constants.AddressZero,
//       resolverHash
//     );

//      let storedTaskId = await scheduleApp.taskIdByUser(deployerAddress);

//       expect(taskId).to.be.equal(storedTaskId);

//   });

//   it('Exec should fail when headache is present', async () => {
//     const [canExec, payload] = await scheduleApp.checkerStartParty();

//     let headeacheAfter = await scheduleApp.headachePresent();
 

//     execData = await scheduleApp.interface.encodeFunctionData('startParty');
//     execAddress = scheduleApp.address;
//     execSelector = await ethers.utils.defaultAbiCoder.encode(
//       ['string'],
//       ['startParty']
//     );
//     resolverAddress = scheduleApp.address;
//     resolverData = await scheduleApp.interface.encodeFunctionData(
//       'checkerStartParty'
//     );

//      await expect(
//      ops
//       .connect(executor)
//       .exec(
//         ethers.utils.parseEther('0.1'),
//         ETH,
//         scheduleApp.address,
//         true,
//         true,
//         resolverHash,
//         execAddress,
//         execData
//       )
//      ).to.be.revertedWith('Ops.exec:NOT_READY');
//   });

//   it('Exec should Success when headache is not present', async () => {
//     const [canExec, payload] = await scheduleApp.checkerStartParty();

//     await scheduleApp.headacheFinish();

    

//     execData = await scheduleApp.interface.encodeFunctionData('startParty');
//     execAddress = scheduleApp.address;
//     resolverAddress = scheduleApp.address;
//     resolverData = await scheduleApp.interface.encodeFunctionData(
//       'checkerStartParty'
//     );

//     resolverHash = ethers.utils.keccak256(
//       new ethers.utils.AbiCoder().encode(
//         ['address', 'bytes'],
//         [resolverAddress, resolverData]
//       )
//     );

//      await  ops
//       .connect(executor)
//       .exec(
//         ethers.utils.parseEther('0.1'),
//         ETH,
//         scheduleApp.address,
//         true,
//         true,
//         resolverHash,
//         execAddress,
//         execData
//       )
    
//      let headeacheAfter = await scheduleApp.headachePresent();
//      expect(headeacheAfter).true;   

//   });

//   it('Checker funciton should return correct values', async () => {
  
//     await scheduleApp.headacheStart();
//     execData = await scheduleApp.interface.encodeFunctionData('startParty');
 
//     const [canExec, payload] = await scheduleApp.checkerStartParty();

//     expect(canExec).false;
//     expect(payload).to.be.equal(execData)

//   });


//   it('it should cancel the Task ', async () => {
//     let taskIdBefore = await scheduleApp.taskIdByUser(deployerAddress);
//     await scheduleApp.cancelTask();

//     let taskIdAfter= await scheduleApp.taskIdByUser(deployerAddress);

//     expect(taskIdBefore).to.not.equal(ethers.constants.AddressZero);
  
//     let taskByUser = await ops.getTaskIdsByUser(scheduleApp.address)
//     expect(taskByUser.length).to.equal(0);

//   });
//   it('it should cancel the Task knowing the taskID ', async () => {
//   await scheduleApp.createTask();

//   let taskByUser = await ops.getTaskIdsByUser(scheduleApp.address)
//   expect(taskByUser.length).to.equal(1);

//   execData = await scheduleApp.interface.encodeFunctionData('startParty');
//   execAddress = scheduleApp.address;
//   execSelector = await ops.getSelector('startParty()');
//   resolverAddress = scheduleApp.address;
//   resolverData = await scheduleApp.interface.encodeFunctionData(
//     'checkerStartParty'
//   );

//   resolverHash = ethers.utils.keccak256(
//     new ethers.utils.AbiCoder().encode(
//       ['address', 'bytes'],
//       [resolverAddress, resolverData]
//     )
//   );

//   taskId = await ops.getTaskId(
//     scheduleApp.address,
//     execAddress,
//     execSelector,
//     true,
//     ethers.constants.AddressZero,
//     resolverHash
//   );

//   await scheduleApp.cancelTaskById(taskId,deployerAddress);
 
//    taskByUser = await ops.getTaskIdsByUser(scheduleApp.address)
//    expect(taskByUser.length).to.equal(0);

//   });

//   it('it should revert when calling directly the exec function ', async () => {
     
//     await expect(scheduleApp.startParty()).to.be.revertedWith('OpsReady: onlyOps');

//   });

//  // ============= ============= Create Simple Task and cancel adter first execution Use Case Business Logic  ============= ============= //

//  it('it should create a task and cancel after first exec', async () => { 
 
//   const depositAmount = ethers.utils.parseEther('10');
//   await scheduleApp.fundGelato(depositAmount, { value: depositAmount });
 
//   await scheduleApp.headacheFinish();

//   await scheduleApp.createTaskAndCancel()


//   execData = await scheduleApp.interface.encodeFunctionData('startPartyandCancel',[deployerAddress]);
//   execAddress = scheduleApp.address;
//   execSelector = await ops.getSelector('startPartyandCancel(address)');
//   resolverAddress = scheduleApp.address;
//   resolverData = await scheduleApp.interface.encodeFunctionData(
//     'checkerCancel',[deployerAddress]
//   )

//   resolverHash = ethers.utils.keccak256(
//     new ethers.utils.AbiCoder().encode(
//       ['address', 'bytes'],
//       [resolverAddress, resolverData]
//     )
//   );

//   taskId = await ops.getTaskId(
//     scheduleApp.address,
//     execAddress,
//     execSelector,
//     true,
//     ethers.constants.AddressZero,
//     resolverHash
//   );


//     let storeId = await scheduleApp.taskIdByUser(deployerAddress)
//     expect(taskId).equal(storeId)


  
//     await  ops
//     .connect(executor)
//     .exec(
//       ethers.utils.parseEther('0.1'),
//       ETH,
//       scheduleApp.address,
//       true,
//       true,
//       resolverHash,
//       execAddress,
//       execData
//     )


//       storeId = await scheduleApp.taskIdByUser(deployerAddress)
    
//       expect(storeId).to.equal(ethers.utils.hexZeroPad(ethers.utils.hexlify(0), 32))

//       let taskByUser = await ops.getTaskIdsByUser(scheduleApp.address)

//       expect(taskByUser.length).to.equal(0);

// });

//  // ============= ============= Create Simple Task WITHOUT Prepayment Use Case Business Logic  ============= ============= //
//  it('it should revert when Contract has no funds ', async () => { 
//   await expect(scheduleApp.createTaskNoPrepayment()).to.be.revertedWith('NO_FUNDING');
// });



// it('it should accept funds', async () => { 
 
//   let balanceBefore = await provider.getBalance(scheduleApp.address)
 
//   let  tx = {
//     to: scheduleApp.address,
//     value: parseEther("10")
// };

// await deployer.sendTransaction(tx);

// let balanceAfter = await provider.getBalance(scheduleApp.address)

// expect(+balanceAfter-+balanceBefore).to.equal(10*10**18)

// });


//  it('it should create no-prepayment task with the correct Task ID', async () => { 
 
//   let  tx = {
//     to: scheduleApp.address,
//     value: parseEther("10")
// };

// await deployer.sendTransaction(tx);
 
//   await scheduleApp.createTaskNoPrepayment();


//   execData = await scheduleApp.interface.encodeFunctionData('startPartyNoPrepayment');
//   execAddress = scheduleApp.address;
//   execSelector = await ops.getSelector('startPartyNoPrepayment()');
//   resolverAddress = scheduleApp.address;
//   resolverData = await scheduleApp.interface.encodeFunctionData(
//     'checkerNoPrepayment'
//   )

//   resolverHash = ethers.utils.keccak256(
//     new ethers.utils.AbiCoder().encode(
//       ['address', 'bytes'],
//       [resolverAddress, resolverData]
//     )
//   );

//   taskId = await ops.getTaskId(
//     scheduleApp.address,
//     execAddress,
//     execSelector,
//     false,
//     ETH,
//     resolverHash
//   );

  
//   let storeId = await scheduleApp.taskIdByUser(deployerAddress)
//     expect(taskId).to.equal(storeId)
  
// });

// it('it should Execshould Success no-prepayment task and decrease contract funds', async () => {
//   const [canExec, payload] = await scheduleApp.checkerStartParty();

//   let balanceBefore = (await provider.getBalance(scheduleApp.address)).toString()
 

//   await scheduleApp.headacheFinish();

  

//   execData = await scheduleApp.interface.encodeFunctionData('startPartyNoPrepayment');
//   execAddress = scheduleApp.address;
//   execSelector = await ops.getSelector('startPartyNoPrepayment()');
//   resolverAddress = scheduleApp.address;
//   resolverData = await scheduleApp.interface.encodeFunctionData(
//     'checkerNoPrepayment'
//   )

//   resolverHash = ethers.utils.keccak256(
//     new ethers.utils.AbiCoder().encode(
//       ['address', 'bytes'],
//       [resolverAddress, resolverData]
//     )
//   );

//    await  ops
//     .connect(executor)
//     .exec(
//       ethers.utils.parseEther('0.1'),
//       ETH,
//       scheduleApp.address,
//       false,
//       true,
//       resolverHash,
//       execAddress,
//       execData
//     )
  
//     let balanceAfter = (await provider.getBalance(scheduleApp.address)).toString()

//    let headeacheAfter = await scheduleApp.headachePresent();
//    expect(headeacheAfter).true;   

//    expect(+balanceBefore-(+balanceAfter)).to.equal(0.1 * 10**18)

// });


});