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
import {LoadingProgressService} from "../services/loading-progress.service";
import {sleep} from "../common";

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

    constructor(private _notify: NotificationService, private _ngZone: NgZone, private readonly cache: NgForageCache,
                private _loading: LoadingProgressService) {
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

    public async callQueryAPI(functionName: string, payload: any, cacheForSeconds: number = 60, interrupted: () => boolean): Promise<any> {

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
                    log.debug("Value for " + key + "in cache");
                    // log.debug("Value for " + key + " was " + JSON.stringify(cachedItem.data));
                    if (!environment.production) {
                        // tslint:disable-next-line:no-console
                        console.debug("Return cached item", JSON.stringify(cachedItem));
                    }
                    return cachedItem.data;
                } else {
                    log.debug("Value for " + key + " not in cache");
                    return await this.callAPIInternal(path, payload, cacheForSeconds, key, false, true, false, interrupted);
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


    public async callMapAPIWithCache(path: string, payload: any, cacheForSeconds: number = -1, useGet = false, retry = true,
                                     interrupted: () => boolean): Promise<any> {
        log.verbose("callMapAPIWithCache()");
        const key = "rest:map/" + path + ":" + JSON.stringify(payload);
        const cachedItem = await this.cache.getCached(key);
        if (interrupted()) {
            log.debug("callMapAPIWithCache() interrupted");
            return null;
        }
        if (cacheForSeconds > 0 && cachedItem && cachedItem.hasData && !cachedItem.expired) {
            // tslint:disable-next-line:no-console
            log.verbose("Value for " + key + "in cache");
            // log.debug("Value for " + key + " was " + JSON.stringify(cachedItem.data));
            // console.debug("Return cached item", JSON.stringify(cachedItem));
            return cachedItem.data;
        } else {
            log.info("Value for " + key + " not in cache");
            return await this.callAPIInternal("/map/" + path, payload, cacheForSeconds, key, useGet, retry, false, interrupted);
        }
    }

    public async callMapAPIWithCacheAndPaging(path: string, payload: any, transform: (any) => any, cacheForSeconds: number = -1,
                                              pageSize = 300,
                                              maxPages = 100, interrupted: () => boolean = () => false) {
        try {
            const result: any[] = [];
            let page = 0;
            while (!interrupted()) {
                const rawResult = await this.callMapAPIWithCache(path, {...payload, pageSize, page,}, cacheForSeconds, false, false,
                                                                 interrupted);
                log.debug(rawResult.length + " tweets back from server");
                for (const item of rawResult) {
                    result.push(transform(item));
                }
                if (page > 0) {
                    this._loading.showDeterminateProgress("Loading page " + page, page / maxPages);
                }
                if (rawResult.length < pageSize || page === maxPages - 1) {
                    this._loading.hideProgress();
                    return result;
                } else {
                    page++;
                }
            }
            if (interrupted()) {
                log.debug("Interrupted while paging " + path);
                return null;
            }
        } catch (e) {
            log.error(e);
        }
    }

    public async callMapAPIWithCacheAndDatePaging(path: string, payload: any, showSpinner = false,
                                                  transform: (any) => any = (i) => i,
                                                  cacheForSeconds: number = -1,
                                                  pageDurationInHours = 30 * 24,
                                                  retry = true, interrupted: () => boolean = () => false): Promise<any> {
        try {
            const key = "rest:query/" + path + ":" + JSON.stringify(payload);
            const cachedItem = await this.cache.getCached(key);
            if (interrupted()) {
                log.debug("Interrupted");
                return null;
            }
            if (cacheForSeconds > 0 && cachedItem && cachedItem.hasData && !cachedItem.expired) {
                // tslint:disable-next-line:no-console
                log.verbose("Value for " + key + "in cache");
                // log.debug("Value for " + key + " was " + JSON.stringify(cachedItem.data));
                // console.debug("Return cached item", JSON.stringify(cachedItem));
                return cachedItem.data;
            } else {
                log.info("Value for " + key + " not in cache");
                const result: any[] = [];
                let startDate = payload.startDate;
                let currEndDate = payload.startDate + pageDurationInHours * 60 * 60 * 1000 - 1;
                const iterations = (payload.endDate - payload.startDate) / (pageDurationInHours * 60 * 60 * 1000);
                let count = 0;
                if (showSpinner) {
                    this._loading.showDeterminateProgress("Loading date range", 0);
                }
                while (!interrupted()) {
                    const endDate = payload.endDate < currEndDate ? payload.endDate : currEndDate;
                    const rawResult = await this.callMapAPIWithCache(path, {...payload, startDate, endDate}, cacheForSeconds, false, retry,
                                                                     interrupted);
                    log.debug(rawResult.length + " results back from server");
                    for (const item of rawResult) {
                        result.push(transform(item));
                    }
                    if (endDate < payload.endDate) {
                        if (showSpinner) {
                            this._loading.showDeterminateProgress("Loading date range", count++ / iterations);
                        }
                        currEndDate += pageDurationInHours * 60 * 60 * 1000;
                        startDate += pageDurationInHours * 60 * 60 * 1000;
                    } else {
                        if (showSpinner) {
                            this._loading.hideProgress();
                        }
                        log.debug("Aggregated Result", result);
                        log.debug("Aggregated Result Size", result.length);
                        if (cacheForSeconds > 0) {
                            await this.cache.setCached(key, result, cacheForSeconds * 1000);
                        }
                        return result;
                    }
                }
                if (interrupted()) {
                    log.debug("Interrupted while paging " + path);
                    return null;
                }

            }
        } catch (e) {
            log.error(e);
            throw e;
        }
    }


    private async callAPIInternal(fullPath: string, payload: any, cacheForSeconds: number, key: string,
                                  useGet = false, retry = true, showWaitingSpinner = false,
                                  interrupted: () => boolean): Promise<Promise<any>> {
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
        let retryCount = retry ? 4 : 1;
        while (retryCount-- > 0) {
            let response: Promise<any>;

            if (interrupted()) {
                log.debug("callAPIInternal() interrupted");
                return null;
            }
            if (useGet) {
                response = API.get("query", fullPath, {
                    'queryStringParameters': payload,
                    headers:                 {
                        Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`,
                    },

                });
            } else {
                response = API.post("query", fullPath, {
                    body:    payload,
                    headers: {
                        Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`,
                    },

                });
            }
            let cacheInMillis: number = cacheForSeconds * 1000 * (1 + Math.random() / 10);
            try {
                const data = await response;
                if (typeof data !== "undefined") {
                    // tslint:disable-next-line:no-console
                    if (!environment.production) {
                        console.debug("Returning uncached item", data);
                    }
                    if (cacheForSeconds > 0) {
                        await this.cache.setCached(key, data, cacheInMillis);
                    }
                } else {
                    if (!environment.production) {
                        console.debug("Returning undefined item", data);
                    }
                }
                this._loading.hideIndeterminateSpinner();
                return data;
            } catch (e) {
                this.calls++;
                log.warn(e);
                if (showWaitingSpinner) {
                    this._loading.showIndeterminateSpinner();
                }
            }
            await sleep(60000 / (retryCount + 1));
        }
        this._notify.show(
            "Sorry, we're having difficulties could you please refresh the page, if that doesn't work please try again in a few minutes. Apologies for the inconvenience.");
        if (showWaitingSpinner) {
            this._loading.hideIndeterminateSpinner();
        }
        throw (new Error("Failed after retrying " + fullPath));
    }
}
