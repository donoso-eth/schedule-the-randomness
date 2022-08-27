// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.

import { writeFileSync,readFileSync } from "fs";
import {copySync, ensureDir,existsSync } from 'fs-extra'
import { ethers,hardhatArguments } from "hardhat";
import config from "../hardhat.config";
import { join } from "path";
import { createHardhatAndFundPrivKeysFiles } from "../helpers/localAccounts";
import * as hre from 'hardhat';
import { ScheduleTheRandomness__factory } from "../typechain-types";
import { initEnv, waitForTx } from "../helpers/utils";

const airnodeAdmin = require('@api3/airnode-admin');



interface ICONTRACT_DEPLOY {
  artifactsPath:string,
  name:string,
  ctor?:any,
  jsonName:string
}


/// 0x6Eb87EcCe6218Cd0e97299331D2aa5d2e53da5cD Goerli

//// 0xa0AD79D995DdeeB18a14eAef56A549A04e3Aa1Bd AirnodeRv

 let airnode  = "0x9d3C147cA16DB954873A498e0af5852AB39139f2"
////  endpointIdUint256  0xfb6d017bb87991b7495f563db3c8cf59ff87b09781947bb1e417006ad7f55a78
let  endpointIdUint256Array  = "0x27cc2713e7f968e4e86ed274a051a5c8aaee9cca66946f23af6f29ecea9704c3";
let xpub =  "xpub6DXSDTZBd4aPVXnv6Q3SmnGUweFv6j24SK77W4qrSFuhGgi666awUiXakjXruUSCDQhhctVG7AQt67gMdaRAsDnDXv23bBRKsMWvRzo6kbf";


// Ops
// 0xc1C6805B857Bef1f412519C4A842522431aFed39



const contract_path_relative = '../src/assets/contracts/';
const processDir = process.cwd()
const contract_path = join(processDir,contract_path_relative)
ensureDir(contract_path)

async function main() {


const [deployer] = await initEnv(hre)

console.log(deployer.address)

let network = hardhatArguments.network;
if (network == undefined) {
  network = config.defaultNetwork;
}

  const contract_config = JSON.parse(readFileSync( join(processDir,'contract.config.json'),'utf-8')) as {[key:string]: ICONTRACT_DEPLOY}
  
  const toDeployName = "scheduleTheRandomness";
  let toDeployContract = contract_config[toDeployName];

  console.log(11111);

  const scheduleTheRandomness= await new  ScheduleTheRandomness__factory(deployer).deploy(
    "0xc1C6805B857Bef1f412519C4A842522431aFed39",
    "0x6Eb87EcCe6218Cd0e97299331D2aa5d2e53da5cD",
    '0xa0AD79D995DdeeB18a14eAef56A549A04e3Aa1Bd',
    449
  );


  let artifactsPath = join(
    processDir,
    `./artifacts/contracts/${toDeployContract.artifactsPath}`
  );
  let Metadata = JSON.parse(readFileSync(artifactsPath, 'utf-8'));

  writeFileSync(
    `${contract_path}/${toDeployContract.jsonName}_metadata.json`,
    JSON.stringify({
      abi: Metadata.abi,
      name: toDeployContract.name,
      address: scheduleTheRandomness.address,
      network: network,
    })
  );

  console.log(
    toDeployContract.name + ' Contract Deployed to:',
    scheduleTheRandomness.address
  );



// Set the parameters that will be used to make Airnode requests
// const receipt = await scheduleTheRandomness.setRequestParameters(
//   airnode,
//   endpointIdUint256Array,
//   sponsorWalletAddress
// );

// let getPromises = [];
// for (let i=0;i<20;i++){
//  let pro =  scheduleTheRandomness.components(i);
//  getPromises.push(pro)
// }
// const values = await Promise.all(getPromises)

// console.log(values)

  ///// copy Interfaces and create Metadata address/abi to assets folder
  copySync(
    `./typechain-types/${toDeployContract.name}.ts`,
    join(contract_path, 'interfaces', `${toDeployContract.name}.ts`)
  );
 
 
  ///// create the local accounts file
  if (
    !existsSync(`${contract_path}/local_accouts.json`) &&
    (network == 'localhost' || network == 'hardhat')
  ) {
    const accounts_keys = await createHardhatAndFundPrivKeysFiles(
      hre,
      contract_path
    );
    writeFileSync(
      `${contract_path}/local_accouts.json`,
      JSON.stringify(accounts_keys)
    );
  }

 
  ///// copy addressess files
  if (!existsSync(`${contract_path}/interfaces/common.ts`)) {
    copySync(
      './typechain-types/common.ts',
      join(contract_path, 'interfaces', 'common.ts')
    );
  }


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
