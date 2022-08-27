import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { DappBaseComponent, DappInjector, ICOMPONENT, PLANSTATUS, Web3Actions } from 'angular-web3';
import { utils } from 'ethers';
import { MessageService } from 'primeng/api';
import { takeUntil } from 'rxjs';
import { SmartContractService } from 'src/app/shared/services/smart-contract.service';






@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers:[]
})
export class HomeComponent extends DappBaseComponent implements OnInit {

  components:Array<ICOMPONENT> ;

  planStatus: PLANSTATUS = PLANSTATUS.WAITING;
  busy = false;

  utils = utils

  qualityPlanStarted?:boolean;;
 

  qualityLaunched = 0;
   constructor(private msg: MessageService,
    public smartcontractService:SmartContractService,
    private router: Router, dapp: DappInjector, store: Store) {
    super(dapp, store);
    this.components = createComponenst()


  }


  async refreshStatus(){
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    let chain_state = await this.smartcontractService.getComponents();
  
    console.log(chain_state);

    for (const compoChain of chain_state ){
     let foundcompo =  this.components.filter(fil=> fil.id == compoChain.id)[0];
     foundcompo.status = compoChain.status;
     foundcompo.timestamp = new Date(compoChain.timestamp*1000).toLocaleTimeString()
    }

     console.log(this.components)
     this.store.dispatch(Web3Actions.chainBusy({ status: false}));
  }



  async startQualityPlan() {

    this.qualityPlanStarted = true;
  

   let tx = await this.dapp.defaultContract?.instance?.startQualityPlan();
   await tx?.wait();


  }

  ngOnInit(): void {
    if (this.blockchain_status == 'wallet-connected'){
    
    }
  }

  override async hookContractConnected(): Promise<void> {
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
      }
    
  }
}


const createComponenst = ():Array<ICOMPONENT> => {
 const ids =  [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];

const components = [];

  for (const id of ids){
    let compo = { id, status:0, timestamp:'Not yet'};
    components.push(compo);
  }
return components as ICOMPONENT[]

}