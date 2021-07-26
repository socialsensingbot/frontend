import {Component, OnInit} from "@angular/core";
import {PreferenceService} from "../pref/preference.service";
import {DashboardService} from "../pref/dashboard.service";

@Component({
             selector:    "app-analytics",
             templateUrl: "./analytics.component.html",
             styleUrls:   ["./analytics.component.scss"]
           })
export class AnalyticsComponent implements OnInit {
  public ready: boolean;
  public activity: boolean;
  public sidebarVisible = true;

  constructor(public pref: PreferenceService, public dash: DashboardService) { }

  async ngOnInit() {
    this.ready = true;
    $("#loading-div").css("opacity", 0.0);
    setTimeout(() => $("#loading-div").remove(), 1000);
    await this.dash.init();
  }

}
