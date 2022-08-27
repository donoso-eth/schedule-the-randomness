import { Injectable } from '@angular/core';
import { DappInjector } from 'angular-web3';
import { ethers } from 'ethers';


@Injectable({
  providedIn: 'root'
})
export class SmartContractService {

  constructor(public dapp: DappInjector) { }

  async planisActive() {
    return  await this.dapp.defaultContract?.instance.planIsActive()
  }


  async getComponents():Promise<Array<any>> {
    let getPromises = [];
    for (let i = 1; i <= 20; i++) {
      let pro = this.dapp.defaultContract?.instance.components(i);
      getPromises.push(pro);
    }
    const values = await Promise.all(getPromises);
  
    return values.map(ele=> { 
      let timestamp = ele?.timestamp;
      if(timestamp  == undefined) {
      timestamp =  ethers.BigNumber.from(0);
    }  return {id:ele?.id, status:ele?.status, timestamp:+(timestamp).toString()} });
  };
  
  

}
