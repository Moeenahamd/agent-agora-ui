import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgxLoadingModule } from "ngx-loading";
import { ToastContainerModule, ToastrModule } from 'ngx-toastr';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

const config: SocketIoConfig = { url: 'https://viewpro.com', options: {} };
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    NgxLoadingModule.forRoot({}),
    SocketIoModule.forRoot(config),
    BrowserAnimationsModule, // required animations module
    ToastrModule.forRoot({
      
    timeOut: 2500,
    positionClass: 'toast-top-right',
    preventDuplicates: true,
    }),
    ToastContainerModule 
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
