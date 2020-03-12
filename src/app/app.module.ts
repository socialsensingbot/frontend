import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import { AmplifyAngularModule, AmplifyService,AmplifyModules } from 'aws-amplify-angular';
import Auth from '@aws-amplify/auth';
import Interactions from '@aws-amplify/interactions';
import Storage from '@aws-amplify/storage';

import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { MaterialModule } from './material/material.module';
import { AppRoutingModule } from './app-routing.module';
import { MapComponent } from './map/map.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { LoaderComponent } from './loader/loader.component';
import { SignUpComponent } from './auth/sign-up/sign-up.component';
import { AuthComponent } from './auth/auth.component';
import { CountryCodeSelectComponent } from './auth/country-code-select/country-code-select.component';
import { FilterPipe } from './auth/country-code-select/filter.pipe';
import { SignInComponent } from './auth/sign-in/sign-in.component';
import { ConfirmCodeComponent } from './auth/confirm-code/confirm-code.component';
import { AuthService } from './auth/auth.service';
import {Router} from "@angular/router";
import {HomeComponent} from "./home/home.component";
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
@NgModule({
            declarations: [
              AppComponent,
              MapComponent,
              LoaderComponent,
              SignUpComponent,
              AuthComponent,
              CountryCodeSelectComponent,
              FilterPipe,
              SignInComponent,
              ConfirmCodeComponent,
              HomeComponent
            ],
            imports:      [
              BrowserModule,
              BrowserAnimationsModule,
              AmplifyAngularModule,
              MaterialModule,
              AppRoutingModule,
              FormsModule,
              ReactiveFormsModule,
              LeafletModule.forRoot()
            ],
            providers:    [{
              provide: AmplifyService,
              useFactory:  () => {
                return AmplifyModules({
                                        Auth,
                                        Storage,
                                        Interactions
                                      });
              }
            },AuthService],
            bootstrap:    [AppComponent],
            entryComponents: [LoaderComponent, CountryCodeSelectComponent]
          },)
export class AppModule {
}
