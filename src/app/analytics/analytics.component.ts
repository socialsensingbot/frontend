import {Component, OnInit} from "@angular/core";
import {PreferenceService} from "../pref/preference.service";
import {DashboardService} from "../pref/dashboard.service";
import {LoadingProgressService} from "../services/loading-progress.service";
import {environment} from "../../environments/environment";
import {Hub} from "@aws-amplify/core";
import {MapSelectionService} from "../map-selection.service";

@Component({
               selector:    "app-analytics",
               templateUrl: "./analytics.component.html",
               styleUrls:   ["./analytics.component.scss"]
           })
export class AnalyticsComponent implements OnInit {
    public ready: boolean;
    public activity: boolean;
    public sidebarVisible = true;
    public isDev: boolean = !environment.production;


    constructor(public pref: PreferenceService, public dash: DashboardService, public map: MapSelectionService,
                public loading: LoadingProgressService) {
    }

    async ngOnInit() {
        this.ready = true;
        await this.dash.init();
        this.loading.loaded();
    }

    public logout(): void {
        Hub.dispatch("app.logout", {event: "analytics.logout"});
    }

}
