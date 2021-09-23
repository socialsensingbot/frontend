import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from "@angular/core";
import {MetadataService} from "../../../api/metadata.service";
import {ActivatedRoute} from "@angular/router";
import {RESTDataAPIService} from "../../../api/rest-api.service";
import {Logger} from "@aws-amplify/core";
import {PreferenceService} from "../../../pref/preference.service";
import {TimeseriesAnalyticsComponentState, TimeseriesCollectionModel, TimeseriesModel, TimeseriesRESTQuery} from "../../timeseries";
import {UIExecutionService} from "../../../services/uiexecution.service";
import {NotificationService} from "src/app/services/notification.service";
import {toLabel} from "../../graph";
import {dayInMillis, nowRoundedToHour} from "../../../common";
import {v4 as uuidv4} from "uuid";
import {LayerGroup} from "../../../types";

const log = new Logger("timeseries-ac");


@Component({
               selector:    "app-widget-timeseries",
               templateUrl: "./timeseries-widget.component.html",
               styleUrls:   ["./timeseries-widget.component.scss"]
           })
export class TimeseriesWidgetComponent implements OnInit, OnDestroy, OnChanges {
    @Input()
    public height: number;
    public source = "twitter";
    public hazard = "flood";
    public animated = false;
    public ready: boolean;
    public updating = false;
    public error: boolean;
    public scrollBar = true;
    public changed = new EventEmitter();
    public connect = false;
    public activity: boolean;
    public seriesCollection: TimeseriesCollectionModel;
    public title = "";
    @Input()
    private id: string;

    private _state: TimeseriesAnalyticsComponentState = null;

    @Input()
    public set state(value: TimeseriesAnalyticsComponentState) {
        if (JSON.stringify(value) !== JSON.stringify(this._state)) {
            this._state = value;
            this.title = this._state.title || "";
            console.log("Loaded saved graph with state ", this._state);
            this.updating = true;
            if (!this.seriesCollection) {
                this.seriesCollection = new TimeseriesCollectionModel("date",
                                                                      this._state.eoc,
                                                                      this._state.eoc === "exceedance" ? "Return Period" : "Count",
                                                                      "Date",
                                                                      this._state.rollingAverage || false,
                                                                      this._state.avgLength || 14,
                                                                      true,
                                                                      this._state.dateSpacing || dayInMillis,
                                                                      this._state.lob || "line"
                );
            } else {
                this.seriesCollection.clear();
            }
            for (const query of this._state.queries) {
                this.updateGraph(query, true);
            }
            this.ready = true;
        }
    }

    constructor(public metadata: MetadataService,
                public notify: NotificationService,
                protected _route: ActivatedRoute, protected _api: RESTDataAPIService, public pref: PreferenceService,
                public exec: UIExecutionService) {
    }

    async ngOnInit() {


    }

    public emitChange() {

    }

    public ngOnDestroy(): void {

    }

    public async updateGraph(q: TimeseriesRESTQuery, force) {
        // Immutable copy
        const query: TimeseriesRESTQuery = JSON.parse(JSON.stringify(q));

        await this.exec.queue("update-timeseries-graph", null,
                              async () => {
                                  try {
                                      log.debug("Graph update from query ", query);

                                      this.emitChange();
                                      if (query.textSearch.length > 0 || query.regions.length > 0 || force) {
                                          const queryResult = await this.executeQuery(query);
                                          if (queryResult && queryResult.length > 0) {
                                              this.seriesCollection.updateTimeseries(
                                                  new TimeseriesModel(toLabel(query, this.pref.combined.layers),
                                                                      queryResult,
                                                                      query.__series_id));
                                          } else {
                                              log.warn(queryResult);
                                          }
                                      } else {
                                          log.debug("Skipped time series update, force=" + force);
                                      }
                                  } finally {
                                      this.updating = false;
                                  }

                              }, this.id + "-" + (query.__series_id || uuidv4()) + "-" + force, false, true, true,
                              "inactive"
        );

    }


    public async ngOnChanges(changes: SimpleChanges) {

    }

    protected async executeQuery(query: TimeseriesRESTQuery): Promise<any[]> {
        this.updating = true;
        try {
            const payload = {
                layer: this.layerGroup(this.pref.combined.layers.defaultLayer),
                ...query,
                from: nowRoundedToHour() - (365.24 * dayInMillis),
                to:   nowRoundedToHour(),
                name: "time"
            };
            delete payload.__series_id;
            const serverResults = await this._api.callQueryAPI("query", payload);
            this.error = false;
            return this.queryTransform(serverResults);
        } catch (e) {
            log.error(e);
            this.error = true;
            return null;
        } finally {
            this.updating = false;
        }


        this.ready = true;
    }

    protected queryTransform(from: any[]): any[] {
        return from;
    }

    private layerGroup(id: string): LayerGroup {
        return this.pref.combined.layers.available.filter(i => i.id === id)[0];
    }
}
