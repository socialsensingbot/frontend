/*
 * © 2020 All rights reserved.
 */

import {Injectable, NgZone} from "@angular/core";
import Auth from "@aws-amplify/auth";
import * as Lambda from "aws-sdk/clients/lambda";
import {environment} from "../../environments/environment";
import {NotificationService} from "../services/notification.service"; // npm install aws-sdk
import {API} from "@aws-amplify/api";
import {Logger} from "@aws-amplify/core";
import {NgForageCache} from "ngforage";

const useLambda = false;

const retryPeriod = 60000;
const log = new Logger("rest-api-service");

@Injectable({
                providedIn: "root"
            })
export class RESTDataAPIService {

    constructor(private _notify: NotificationService, private _ngZone: NgZone, private readonly cache: NgForageCache,) {
    }

    public async callAPI(functionName: string, payload: any): Promise<any> {

        if (useLambda) {
            log.debug("Calling " + functionName, payload);
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
                                   log.error(err);
                                   reject(err);
                               } else {
                                   log.debug(data);
                                   resolve(JSON.parse(data.Payload.toString()));
                               }

                           }));
                       });
        } else {
            const path = "/" + functionName + "/" + payload.name;
            if (functionName === "query") {

            } else {
                return API.get("query", path, {
                    headers: {
                        Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`,
                    }
                });
            }
        }
    }


    public async callMapAPIWithCache(path: string, payload: any, cacheForSeconds: number = -1): Promise<any> {
        log.debug("callMapAPIWithCache()");
        const key = "rest:map/" + path + ":" + JSON.stringify(payload);
        const cachedItem = await this.cache.getCached(key);
        if (cacheForSeconds > 0 && cachedItem && cachedItem.hasData && !cachedItem.expired) {
            // tslint:disable-next-line:no-console
            log.debug("Value for " + key + "in cache");
            // log.debug("Value for " + key + " was " + JSON.stringify(cachedItem.data));
            console.debug("Return cached item", JSON.stringify(cachedItem));
            return cachedItem.data;
        } else {
            log.debug("Value for " + key + " not in cache");
            return API.post("query", "/map/" + path, {
                body:    payload,
                headers: {
                    Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`,
                },

            }).then(data => {
                if (typeof data !== "undefined") {
                    // tslint:disable-next-line:no-console
                    console.debug("Returning uncached item", data);
                    if (cacheForSeconds > 0) {
                        this.cache.setCached(key, data, cacheForSeconds * 1000);
                    }
                } else {
                    console.debug("Returning undefined item", data);
                }
                return data;
            }).catch(e => {
                log.error(e);
                this._notify.show("No response from the server, maybe a network problem or a slow query.",
                                  "Retrying ...", retryPeriod);
                return new Promise<any>((resolve, reject) => {
                    setTimeout(async () => {
                        API.post("query", "/map/" + path, {
                            body:    payload,
                            headers: {
                                Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`,
                            },
                        }).then(data => this._ngZone.run(() => {
                            this._notify.show("Problem resolved", "Good", 2000);
                            // tslint:disable-next-line:no-console
                            console.debug("Returning uncached item", data);
                            if (cacheForSeconds > 0) {
                                this.cache.setCached(key, data, cacheForSeconds * 1000);
                            }
                            resolve(data);
                        }))
                           .catch(e2 => {
                               this._notify.show("Error running" + " query, please check your network connection");
                               reject(e2);
                           });
                    }, retryPeriod);
                });
            });
        }
    }


}
