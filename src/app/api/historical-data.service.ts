/*
 * © 2020 All rights reserved.
 */

import {Injectable, NgZone} from "@angular/core";
import Auth from "@aws-amplify/auth";
import * as Lambda from "aws-sdk/clients/lambda";
import {environment} from "../../environments/environment";
import {NotificationService} from "../services/notification.service"; // npm install aws-sdk
import {API} from "@aws-amplify/api";

const useLambda = false;

const retryPeriod = 60000;

@Injectable({
                providedIn: "root"
            })
export class HistoricalDataService {

    constructor(private _notify: NotificationService, private _ngZone: NgZone) { }

    public async callAPI(functionName: string, payload: any): Promise<any> {

        if (useLambda) {
            console.log("Calling " + functionName, payload);
            return Auth.currentCredentials()
                       .then(credentials => {
                           const lambda = new Lambda({
                                                         region:      "eu-west-2",
                                                         credentials: Auth.essentialCredentials(credentials)
                                                     });
                           return new Promise<any>((resolve, reject) => lambda.invoke({
                                                                                          FunctionName: functionName + "-" + environment.lamdaEnvironment,
                                                                                          Payload:      JSON.stringify(
                                                                                              payload),
                                                                                      }, (err, data) => {
                               if (err) {
                                   this._notify.show("Error communicating with server");
                                   console.error(err);
                                   reject(err);
                               } else {
                                   console.log(data);
                                   resolve(JSON.parse(data.Payload.toString()));
                               }

                           }));
                       });
        } else {
            const path = "/" + functionName + "/" + payload.name;
            if (functionName === "query") {
                return API.post("query", path, {
                    body:    payload,
                    headers: {
                        Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`,
                    },

                }).catch(e => {
                    console.error(e);
                    this._notify.show("No response from the server, maybe a network problem or a slow query.",
                                      "Retrying ...", retryPeriod);
                    return new Promise<any>((resolve, reject) => {
                        setTimeout(async () => {
                            API.post("query", path, {
                                body:    payload,
                                headers: {
                                    Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`,
                                },
                            }).then(data => this._ngZone.run(() => {
                                this._notify.show("Problem resolved", "Good", 2000);
                                resolve(data);
                            }))
                               .catch(e => {
                                   this._notify.show("Error running" + " query, please check your network connection");
                                   reject(e);
                               });
                        }, retryPeriod);
                    });
                });
            } else {
                return API.get("query", path, {headers: {
                        Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`,
                    }});
            }
        }


    }

}
