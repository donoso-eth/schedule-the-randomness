import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { DappBaseComponent, DappInjector, Web3Actions } from 'angular-web3';
import { utils } from 'ethers';
import { MessageService } from 'primeng/api';
import { takeUntil } from 'rxjs';






@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers:[]
})
export class HomeComponent extends DappBaseComponent implements OnInit {

  components:Array<number> = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,1617,18,19,20];

  utils = utils

  qualityPlanStarted = false;
 

  qualityLaunched = 0;
   constructor(private msg: MessageService,private router: Router, dapp: DappInjector, store: Store) {
    super(dapp, store);



  }

  startQualityPlan() {
    this.qualityPlanStarted = true;
    this.qualityLaunched = new Date().getTime()

  }

  ngOnInit(): void {
    if (this.blockchain_status == 'wallet-connected'){
    
    }
  }







  override async hookContractConnected(): Promise<void> {

   

  }
}
