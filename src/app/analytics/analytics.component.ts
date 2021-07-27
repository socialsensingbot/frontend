import {Component, OnInit} from "@angular/core";
import {PreferenceService} from "../pref/preference.service";

@Component({
               selector:    "app-analytics",
               templateUrl: "./analytics.component.html",
               styleUrls:   ["./analytics.component.scss"]
           })
export class AnalyticsComponent implements OnInit {
    public ready: boolean;
    public activity: boolean;
    public sidebarVisible = true;

    constructor(public pref: PreferenceService) { }

    ngOnInit(): void {
        this.ready = true;
        $("#loading-div").css("opacity", 0.0);
        setTimeout(() => $("#loading-div").remove(), 1000);
    }

}
