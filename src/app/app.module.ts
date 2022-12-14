import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DappInjectorModule } from './dapp-injector/dapp-injector.module';
import { StoreModule } from '@ngrx/store';
import { we3ReducerFunction } from 'angular-web3';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoadingComponent } from './shared/components/loading/loading.component';
import { AppTopBarComponent } from './shared/components/toolbar/app.topbar.component';
import { AppFooterComponent } from './shared/components/footer/app.footer.component';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { SmartContractService } from './shared/services/smart-contract.service';

@NgModule({
  declarations: [
    AppComponent,
    LoadingComponent,

    AppTopBarComponent,
    AppFooterComponent

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    DappInjectorModule.forRoot({wallet:'wallet', defaultNetwork:'goerli'}),
    StoreModule.forRoot({web3: we3ReducerFunction}),
    DropdownModule,
    ProgressSpinnerModule,
    ToastModule,
    ButtonModule
  ],
  providers: [MessageService,SmartContractService ],
  bootstrap: [AppComponent]
})
export class AppModule { }
