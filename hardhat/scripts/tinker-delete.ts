import { Contract, ethers, providers, Signer, utils } from "ethers";
import { readFileSync } from "fs-extra";
import { initEnv, waitForTx } from "../helpers/utils";

import { join } from "path";
import * as hre from "hardhat"
import { ScheduleTheRandomness__factory } from "../typechain-types";


import { deriveSponsorWalletAddress} from '@api3/airnode-admin'

const contract_path_relative = '../src/assets/contracts/';
const processDir = process.cwd()
const contract_path = join(processDir,contract_path_relative)
const contract_config = JSON.parse(readFileSync( join(processDir,'contract.config.json'),'utf-8')) as {[key:string]: any}


const tinkerDelete = async () => {

    // ADDRESS TO MINT TO:
    
  console.log('inside')

    const [deployer] = await initEnv(hre)

    const toDeployContract = contract_config["scheduleTheRandomness"]
   
    if (toDeployContract == undefined){
      console.error("Your contract is not yet configured")
      console.error('Please add the configuration to /hardhat/contract.config.json')
      return
      
    }

    const metadata = JSON.parse(readFileSync(`${contract_path}/${toDeployContract.jsonName}_metadata.json`,'utf-8'))
  
  
    const scheduleTheRandomness = ScheduleTheRandomness__factory.connect(metadata.address, deployer)


    // Set the parameters that will be used to make Airnode requests



await waitForTx(scheduleTheRandomness.stopQualityControl());

await waitForTx(scheduleTheRandomness.withdrawContract());

  };

  
  const sleep = (ms:number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  tinkerDelete()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });