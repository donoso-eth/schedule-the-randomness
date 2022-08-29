import { Injectable } from '@angular/core';
import { DappInjector } from 'angular-web3';
import { BigNumber, ethers } from 'ethers';


@Injectable({
  providedIn: 'root'
})
export class SmartContractService {

  constructor(public dapp: DappInjector) { }

  async planisActive() {
    return  await this.dapp.defaultContract?.instance.planIsActive()
  }

  async planStartedAt() {
    return  await this.dapp.defaultContract?.instance.lastLaunched()
  }

  async control() {
    let status = await this.dapp.defaultContract?.instance.status();
    let Id =  +(await this.dapp.defaultContract?.instance.controlId() as BigNumber)?.toString();
    console.log(status,Id);
    let activeId;
    if (status == 0) {
      activeId = Id;
    } else {
      activeId = Id-1
    }
    let control = (await (this.dapp.defaultContract?.instance.controls(activeId) as any))
  
    return { 
      id:activeId, 
      status: control.status == 0 ? 'Express' : control.status == 1 ? 'Medium' : 'Intensive',
      employeeId: +(control.employeeId).toString()
    }



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
