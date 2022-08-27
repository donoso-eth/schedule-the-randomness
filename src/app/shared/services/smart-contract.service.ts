import { Injectable } from '@angular/core';
import { DappInjector } from 'angular-web3';



@Injectable({
  providedIn: 'root'
})
export class SmartContractService {

  constructor(public dapp: DappInjector) { }


  async getComponents():Promise<Array<number>> {
    return new Promise ((resolve,reject)=> {
      setTimeout(()=> {
        resolve([2,3]);
    },1000)
    })
  }

}
