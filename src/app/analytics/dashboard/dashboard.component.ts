import {Component, OnInit} from "@angular/core";
import {BreakpointObserver} from "@angular/cdk/layout";
import {DashboardCard, DashboardService} from "../../pref/dashboard.service";
import {Logger} from "@aws-amplify/core";
import {LoadingProgressService} from "../../services/loading-progress.service";
import {MapSelectionService} from "../../map-selection.service";
import {ActivatedRoute} from "@angular/router";

const log = new Logger("dashboard-component");

@Component({
               selector:    "app-dashboard",
               templateUrl: "./dashboard.component.html",
               styleUrls:   ["./dashboard.component.scss"]
           })
export class DashboardComponent implements OnInit {

    public ready = false;
    public cards: DashboardCard[];
    // /** Based on the screen size, switch from standard to one column per row */
    // cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    //     map( ({matches}) => {
    //         if (matches) {
    //             return ;
    //         }
    //
    //         return this._dash.dashboard.devices.filter((i => i.deviceType === "all"))[0].pages[0].cards;
    //     })
    // );
    public readonly = false;
    public types = [{
        title: "Timeseries",
        type:  "timeseries",
        rows:  2,
        cols:  2,
        state: {textSearch: "", regions: []}
    }];
    public newWidgetTitle = "New Graph";
    public newWidgetType = this.types[0];
    private maxCols = 2;
    private minCols = 1;
    private maxRows = 2;
    private minRows = 1;

    constructor(private breakpointObserver: BreakpointObserver, public dash: DashboardService, public map: MapSelectionService,
                public loading: LoadingProgressService, private _route: ActivatedRoute) {

    }

    public async ngOnInit() {
        this.map.id = this._route.snapshot.params.map;
        console.log("MAP IS " + this.map.id);
        await this.dash.init();
        await this.dash.waitUntilReady();
        this.ready = true;
        log.debug("Dashboard ready with ", this.dash.dashboard);
        this.initDashboard();
        this.loading.loaded();

        this._route.params.subscribe(async params => {
            if (params.map) {
                this.map.id = params.map;
            }

        });

    }

    public saveCard(index: number, data: any) {
        this.dash.dashboard.boards[0].pages[0].cards[index].state = data;
        this.dash.persist();
    }

    public async reset() {
        await this.dash.reset();
        this.initDashboard();
    }

    public expand(card: DashboardCard) {
        if (card.cols < this.maxCols) {
            card.cols++;
        }
        if (card.rows < this.maxRows) {
            card.rows++;
        }
        this.dash.persist();
    }

    public shrink(card: DashboardCard) {
        if (card.cols > this.minCols) {
            card.cols--;
        }
        if (card.rows > this.minRows) {
            card.rows--;
        }
        this.dash.persist();
    }

    public hide(card: DashboardCard) {
        card.hidden = true;
        this.dash.persist();
    }

    public addCard() {
        this.dash.addCard(this.newWidgetType.type, this.newWidgetTitle, this.newWidgetType.cols,
                          this.newWidgetType.rows, this.newWidgetType.state);
        this.initDashboard();
    }

    public debug(card: DashboardCard) {
        log.debug(card);
    }

    public remove(card: DashboardCard) {
        this.dash.removeCard(card);
        this.initDashboard();
    }

    private initDashboard() {
        this.cards = this.dash.dashboard.boards[0].pages[0].cards;
    }
}
