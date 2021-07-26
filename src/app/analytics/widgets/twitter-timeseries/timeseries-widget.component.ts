import {Component, EventEmitter, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges} from "@angular/core";
import {MetadataService} from "../../../api/metadata.service";
import {ActivatedRoute, Router} from "@angular/router";
import {RESTDataAPIService} from "../../../api/rest-api.service";
import {Logger} from "@aws-amplify/core";
import {PreferenceService} from "../../../pref/preference.service";
import {
  TimeseriesAnalyticsComponentState,
  TimeseriesCollectionModel,
  TimeseriesModel,
  TimeseriesRESTQuery
} from "../../timeseries";
import {UIExecutionService} from "../../../services/uiexecution.service";
import {NotificationService} from "src/app/services/notification.service";
import {toLabel} from "../../graph";

const log = new Logger("timeseries-ac");


@Component({
             selector:    "app-widget-timeseries",
             templateUrl: "./timeseries-widget.component.html",
             styleUrls:   ["./timeseries-widget.component.scss"]
           })
export class TimeseriesWidgetComponent implements OnInit, OnDestroy, OnChanges {

  @Input()
  public set state(value: TimeseriesAnalyticsComponentState) {
    this._state = value;

  }

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
  public removable = true;
  public mappingColumns: string[] = [];
  public showForm = true;
  public connect = false;
  public activity: boolean;
  public seriesCollection: TimeseriesCollectionModel;
  public title = "";


  constructor(public metadata: MetadataService,
              public notify: NotificationService,
              protected _route: ActivatedRoute, protected _api: RESTDataAPIService, public pref: PreferenceService,
              public exec: UIExecutionService) {
  }


  private _state: TimeseriesAnalyticsComponentState = null;


  async ngOnInit() {


  }

  public emitChange() {

  }

  public ngOnDestroy(): void {

  }

  public async updateGraph(q: TimeseriesRESTQuery, force) {
    // Immutable copy
    const query = JSON.parse(JSON.stringify(q));
    this.updating = true;
    await this.exec.queue("update-timeseries-graph", null,
                          async () => {
                            log.debug("Graph update from query ", query);

                            this.emitChange();
                            if (query.textSearch.length > 0 || query.regions.length > 0 || force) {
                              const queryResult = await this.executeQuery(query);
                              if (queryResult && queryResult.length > 0) {
                                this.seriesCollection.updateTimeseries(
                                  new TimeseriesModel(toLabel(query), queryResult,
                                                      query.__series_id));
                              } else {
                                log.warn(queryResult);
                              }
                            } else {
                              log.debug("Skipped time series update, force=" + force);
                            }
                            this.updating = false;

                          }, query.__series_id + "-" + force, false, true, true, "inactive"
    );

  }


  public ngOnChanges(changes: SimpleChanges): void {
    if (this._state && !this.ready) {
      this.title = this._state.title || "";
      console.log("Loaded saved graph with state ", this._state);
      this.seriesCollection = new TimeseriesCollectionModel("date",
                                                            this._state.eoc,
                                                            this._state.eoc === "exceedance" ? "Exceedance" : "Count",
                                                            "Date",
                                                            this._state.rollingAverage || false,
                                                            this._state.avgLength || 14,
                                                            true,
                                                            this._state.dateSpacing || 24 * 60 * 60 * 1000,
                                                            this._state.lob
      );
      for (const query of this._state.queries) {
        this.updateGraph(query, true);
      }
      this.ready = true;
    }
  }


  protected async executeQuery(query: TimeseriesRESTQuery): Promise<any[]> {
    this.updating = true;
    try {
      const serverResults = await this._api.callAPI("query", {
        from: new Date().getTime() - (365.24 * 24 * 60 * 60 * 1000),
        to:   new Date().getTime(),
        ...query,
        name:   "time",
        source: this.source,
        hazard: this.hazard
      });
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
}



