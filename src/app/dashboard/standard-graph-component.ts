/*
 * © 2020 All rights reserved.
 */

import {NgZone} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {MetadataService} from "../api/metadata.service";
import {HistoricalDataService} from "../api/historical-data.service";


export abstract class StandardGraphComponent {
    results: any = [];

    query: any = {};

    ready: boolean;

    updating = false;
    noData: boolean;
    error: boolean;
    protected _interval: number;
    protected _changed: boolean;
    protected _storeQueryInURL: boolean;


    constructor(public metadata: MetadataService, protected _zone: NgZone, protected _router: Router,
                protected _route: ActivatedRoute, protected _api: HistoricalDataService,
                protected restQueryName: string,
                protected dateRange = true) {
        this._route.queryParams.subscribe(async params => {
            let fromQuery = false;
            if (this._storeQueryInURL) {

                if (params.from) {
                    this.query.from = +params.from;
                    fromQuery = true;
                } else {
                    this.query.from = new Date().getTime() - (365.25 * 24 * 60 * 60 * 1000);
                }
                if (params.to) {
                    this.query.to = +params.to;
                    fromQuery = true;
                } else {
                    this.query.to = new Date().getTime();
                }
                if (params.dateStep) {
                    this.query.dateStep = +params.dateStep;
                    fromQuery = true;
                } else {
                    this.query.dateStep = 7 * 24 * 60 * 60 * 1000;
                }
            }
            if (params.location) {
                this.query.location = params.location;
                fromQuery = true;
            } else {
                this.query.location = "devon";
            }
            if (fromQuery) {
                this._changed = true;
            }
        });

    }

    public async updateGraph(query: any) {
        this.query = query;
        this._changed = true;
    }

    protected startChangeTimer() {
        return window.setInterval(() => {
            this._zone.run(async () => {

                if (this._changed) {
                    if (!this.updating) {
                        this.updating = true;
                        try {
                            await this.performGraphUpdate();
                        } finally {
                            this.updating = false;
                        }

                    } else {
                        console.log("Already updating");
                    }
                }
            });
        }, 1000);
    }

    protected async performGraphUpdate() {
        if (this._storeQueryInURL) {
            await this._router.navigate([], {queryParams: this.query});
        }
        this.ready = false;
        this._changed = false;
        this.updating = true;
        try {
            const serverResults = await this._api.callAPI("query", {
                ...this.query,
                name:   this.restQueryName,
                source: "twitter",
                hazard: "flood",
                from:   new Date(2021, 0, 1).getTime(),
                to:     Date.now()
            });
            this.noData = serverResults.length === 0;
            this.error = false;
            this.results = this.queryTransform(serverResults);
        } catch (e) {
            console.error(e);
            this.error = true;
            this.noData = false;
        } finally {
            this.updating = false;
        }

      
        this.ready = true;
    }

    protected queryTransform(from: any[]): any[] {
        return from;
    }


}
