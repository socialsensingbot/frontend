import {Component, OnInit} from "@angular/core";
import {PreferenceService} from "../pref/preference.service";
import {DashboardService} from "../pref/dashboard.service";
import {LoadingProgressService} from "../services/loading-progress.service";

@Component({
             selector:    "app-analytics",
             templateUrl: "./analytics.component.html",
             styleUrls:   ["./analytics.component.scss"]
           })
export class AnalyticsComponent implements OnInit {
  public ready: boolean;
  public activity: boolean;
  public sidebarVisible = true;

  constructor(public pref: PreferenceService, public dash: DashboardService,
              public loading: LoadingProgressService) { }

  async ngOnInit() {
    this.ready = true;
    this.loading.loaded();
    await this.dash.init();
  }

}
