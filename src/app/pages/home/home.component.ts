import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { DappBaseComponent, DappInjector, doSignerTransaction, ICOMPONENT, PLANSTATUS, Web3Actions } from 'angular-web3';
import { BigNumber, constants, Signer, utils } from 'ethers';
import { MessageService } from 'primeng/api';
import { createERC20Instance } from 'src/app/shared/helpers/helpers';
import { SmartContractService } from 'src/app/shared/services/smart-contract.service';






@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers:[]
})
export class HomeComponent extends DappBaseComponent implements OnInit {

  components:Array<ICOMPONENT> ;

  planStatus: PLANSTATUS = PLANSTATUS.STILL;
  busy = false;

  showFundingState = false;

  qualityPlanStarted?:boolean;
  balance: string | undefined;
  linkContract: any;
  balanceLink: any;
;
  LinkAdress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";

  qualityLaunched = '0';

  lastControl?: {status:string,id:number,employeeId:number;}

   constructor(private msg: MessageService,
    public smartcontractService:SmartContractService,
    private router: Router, dapp: DappInjector, store: Store) {
    super(dapp, store);
    this.components = createComponenst()
    
  }

  utils = utils;

  async refreshBalance(){
    this.balance = utils.formatEther(await this.dapp.provider?.getBalance(this.dapp.signerAddress as string) as BigNumber);
    this.balanceLink =  utils.formatEther(await this.linkContract.balanceOf(this.dapp.signerAddress as string) as BigNumber);

  }


  

  async refreshStatus(){
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
   
    this.qualityPlanStarted = await this.smartcontractService.planisActive() as boolean;

    this.qualityLaunched = new Date(+(await this.smartcontractService.planStartedAt() as BigNumber).toString()*1000).toLocaleString()
    
    this.lastControl = await this.smartcontractService.control()
   

    let chain_state = await this.smartcontractService.getComponents();
  

    for (const compoChain of chain_state ){
     let foundcompo =  this.components.filter(fil=> fil.id == compoChain.id)[0];
     foundcompo.status = compoChain.status;
     if (compoChain.timestamp == 0) {foundcompo.timestamp='0' } else {
     foundcompo.timestamp = new Date(compoChain.timestamp*1000).toLocaleTimeString()
    }
  }

  
     this.store.dispatch(Web3Actions.chainBusy({ status: false}));
  }


  async lauchDialog(){
    this.showFundingState = true;
  }


  async closeDialog(){
    this.showFundingState = false;
  }

  async startQualityPlan() {

    this.showFundingState = false;

    this.store.dispatch(Web3Actions.chainBusy({ status: true }));

    const resultApprove = await doSignerTransaction(this.linkContract.approve( this.dapp.defaultContract?.address, constants.MaxUint256));

    this.planStatus = PLANSTATUS.WAITING;
  
  
    
   let tx = await this.dapp.defaultContract?.instance?.startQualityPlan({value: utils.parseEther('0.3')});
   await tx?.wait();


    this.refreshBalance()
   
    this.initPlan()
    this.qualityPlanStarted == true;
   this.store.dispatch(Web3Actions.chainBusy({ status: false }));

  }

  async stopQuality() {
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    this.planStatus = PLANSTATUS.STILL;
  

    
   let tx = await this.dapp.defaultContract?.instance?.stopQualityControl();
   await tx?.wait();


  this.defaultContract.instance.removeAllListeners();

    this.refreshStatus();

   this.store.dispatch(Web3Actions.chainBusy({ status: false }));
  }



  ngOnInit(): void {
    if (this.blockchain_status == 'wallet-connected'){
        
    }
  }


  initPlan() {
    this.dapp.defaultContract?.instance.on("qualityControlStart",()=> {
      console.log("QUALITY START");
      this.refreshStatus();
    })

    this.dapp.defaultContract?.instance.on("qualityControlDone",()=> {
      console.log("QUALITY FINISH");
      this.refreshStatus();
    })
  }



  override async hookContractConnected(): Promise<void> {

    this.linkContract = createERC20Instance(this.LinkAdress, this.dapp.signer as Signer)


    this.qualityPlanStarted = await this.smartcontractService.planisActive() as boolean;

      if (this.qualityPlanStarted == true) {

          this.dapp.defaultContract?.instance.on("qualityControlStart",()=> {
            console.log("QUALITY START");
            this.refreshStatus();
          })

          this.dapp.defaultContract?.instance.on("qualityControlDone",()=> {
            console.log("QUALITY FINISH");
            this.refreshStatus();
          })

          this.refreshStatus()
      } else {
        this.planStatus = PLANSTATUS.STILL
        this.refreshStatus()
      }
      this.refreshBalance()
    
  }
}


const createComponenst = ():Array<ICOMPONENT> => {
 const ids =  [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];

const components = [];

  for (const id of ids){
    let compo = { id, status:0, timestamp:'0'};
    components.push(compo);
  }
return components as ICOMPONENT[]

}