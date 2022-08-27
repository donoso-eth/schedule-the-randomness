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


const tinker = async () => {

    // ADDRESS TO MINT TO:


    const [deployer] = await initEnv(hre)

    const toDeployContract = contract_config["scheduleTheRandomness"]
   
    if (toDeployContract == undefined){
      console.error("Your contract is not yet configured")
      console.error('Please add the configuration to /hardhat/contract.config.json')
      return
      
    }
    
    const provider = new providers.JsonRpcProvider();
    const signer:Signer = await provider.getSigner()

    const metadata = JSON.parse(readFileSync(`${contract_path}/${toDeployContract.jsonName}_metadata.json`,'utf-8'))
  
  
    const scheduleTheRandomness = ScheduleTheRandomness__factory.connect(metadata.address, deployer)


    let airnode  = "0x9d3C147cA16DB954873A498e0af5852AB39139f2"
    ////  endpointIdUint256  0xfb6d017bb87991b7495f563db3c8cf59ff87b09781947bb1e417006ad7f55a78
    let  endpointIdUint256Array  = "0x27cc2713e7f968e4e86ed274a051a5c8aaee9cca66946f23af6f29ecea9704c3";
    let xpub =  "xpub6DXSDTZBd4aPVXnv6Q3SmnGUweFv6j24SK77W4qrSFuhGgi666awUiXakjXruUSCDQhhctVG7AQt67gMdaRAsDnDXv23bBRKsMWvRzo6kbf";
    
// Creation os API3 sponsorwallet
const sponsorWalletAddress = await deriveSponsorWalletAddress(
  xpub,
  airnode,
  scheduleTheRandomness.address
);

console.log(
  ' Sponsor Wallet to:',
  sponsorWalletAddress
);

    // Set the parameters that will be used to make Airnode requests
const receipt =  await waitForTx(scheduleTheRandomness.setRequestParameters(
  airnode,
  endpointIdUint256Array,
  sponsorWalletAddress
));


  await waitForTx  (deployer.sendTransaction({
  to: sponsorWalletAddress,
  value: ethers.utils.parseEther("0.1")
}));


await waitForTx  (deployer.sendTransaction({
  to: scheduleTheRandomness.address,
  value: ethers.utils.parseEther("0.5")
}));



await waitForTx(scheduleTheRandomness.startQualityPlan());

  };

  
  const sleep = (ms:number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  tinker()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });