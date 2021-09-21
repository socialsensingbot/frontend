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
import {timer} from "rxjs";

const useLambda = false;

const retryPeriod = 20000;
const log = new Logger("rest-api-service");

@Injectable({
                providedIn: "root"
            })
export class RESTDataAPIService {
    private callsPerMinute = 0;
    private calls = 0;
    private lastCPMCount = 0;

    constructor(private _notify: NotificationService, private _ngZone: NgZone, private readonly cache: NgForageCache) {
        timer(0, 10000).subscribe(() => {
            if (this.lastCPMCount === 0) {
                this.lastCPMCount = Date.now() - 10000;
            }
            this.callsPerMinute = (this.calls / (Date.now() - this.lastCPMCount)) * 60000;
            this.lastCPMCount = Date.now();
            this.calls = 0;
            log.debug("Calls Per Minute: " + this.callsPerMinute);
        });
    }

    public async callQueryAPI(functionName: string, payload: any, cacheForSeconds: number = 60): Promise<any> {

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
                const key = "rest:query/" + path + ":" + JSON.stringify(payload);
                const cachedItem = await this.cache.getCached(key);
                if (cacheForSeconds > 0 && cachedItem && cachedItem.hasData && !cachedItem.expired) {
                    // tslint:disable-next-line:no-console
                    log.debug("Value for " + key + "in cache");
                    // log.debug("Value for " + key + " was " + JSON.stringify(cachedItem.data));
                    console.debug("Return cached item", JSON.stringify(cachedItem));
                    return cachedItem.data;
                } else {
                    log.debug("Value for " + key + " not in cache");
                    return await this.callAPIInternal(path, payload, cacheForSeconds, key, false);
                }
            } else {
                return await API.get("query", path, {
                    headers: {
                        Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`,
                    }
                });
            }
        }
    }


    public async callMapAPIWithCache(path: string, payload: any, cacheForSeconds: number = -1, cacheEmptyResponses = false): Promise<any> {
        log.verbose("callMapAPIWithCache()");
        const key = "rest:map/" + path + ":" + JSON.stringify(payload);
        const cachedItem = await this.cache.getCached(key);
        if (cacheForSeconds > 0 && cachedItem && cachedItem.hasData && !cachedItem.expired && (cacheEmptyResponses || JSON.stringify(
            cachedItem.data) !== "{}")) {
            // tslint:disable-next-line:no-console
            log.verbose("Value for " + key + "in cache");
            // log.debug("Value for " + key + " was " + JSON.stringify(cachedItem.data));
            // console.debug("Return cached item", JSON.stringify(cachedItem));
            return cachedItem.data;
        } else {
            log.info("Value for " + key + " not in cache");
            return await this.callAPIInternal("/map/" + path, payload, cacheForSeconds, key, cacheEmptyResponses);
        }
    }


    private async callAPIInternal(fullPath: string, payload: any, cacheForSeconds: number, key: string,
                                  cacheEmptyResponses: boolean): Promise<Promise<any>> {
        this.calls++;
        if (this.callsPerMinute > environment.maxCallsPerMinute) {
            console.error("Excessive api calls per minute: " + this.callsPerMinute);
            console.error("API call was path: " + fullPath + " payload: " + JSON.stringify(payload));
            console.trace("Excessive calls trace");
            if (!environment.production) {
                this._notify.show(
                    "Too many calls to the server (" + this.callsPerMinute + " > " + environment.maxCallsPerMinute + "). This is most likely a bug and this message will not be shown in production.",
                    "Ignoring this call", 60);
            }
            return;

        }
        return API.post("query", fullPath, {
            body:    payload,
            headers: {
                Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`,
            },

        }).then(data => {
            if (typeof data !== "undefined") {
                // tslint:disable-next-line:no-console
                console.debug("Returning uncached item", data);
                if (cacheForSeconds > 0 && (cacheEmptyResponses || JSON.stringify(data) !== "{}")) {
                    this.cache.setCached(key, data, cacheForSeconds * 1000);
                }
            } else {
                console.debug("Returning undefined item", data);
            }
            return data;
        }).catch(e => {
            this.calls++;
            log.error(e);
            this._notify.show("No response from the server, maybe a network problem or a slow query.",
                              "Retrying ...", retryPeriod);
            return new Promise<any>((resolve, reject) => {
                setTimeout(async () => {
                    API.post("query", fullPath, {
                        body:    payload,
                        headers: {
                            Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`,
                        },
                    }).then(data => this._ngZone.run(() => {
                        this._notify.show("Problem resolved", "Good", 2000);
                        // tslint:disable-next-line:no-console
                        console.debug("Returning uncached item", data);
                        if (cacheForSeconds > 0 && (cacheEmptyResponses || JSON.stringify(data) !== "{}")) {
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
