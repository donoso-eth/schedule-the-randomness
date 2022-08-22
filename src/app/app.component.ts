import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { PrimeNGConfig } from 'primeng/api';
import { takeUntil } from 'rxjs';
import { DappBaseComponent } from './dapp-injector/classes';
import { DappInjector } from './dapp-injector/dapp-injector.service';
import { web3Selectors } from './dapp-injector/store';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent extends DappBaseComponent implements OnInit {
  title = 'pcr';
  constructor(private primengConfig: PrimeNGConfig, dapp: DappInjector, store: Store, private router:Router) {
    super(dapp, store);
        //////  Force Disconnect
        this.store
        .pipe(web3Selectors.hookForceDisconnect)
        .pipe(takeUntil(this.destroyHooks))
        .subscribe(() => {
         // location.reload();
          this.router.navigateByUrl('landing')
         
        });
  
  }
  ngOnInit() {
    this.primengConfig.ripple = true;
    document.documentElement.style.fontSize = '20px';
  }
}
