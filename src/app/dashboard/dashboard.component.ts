import {Component, OnInit} from "@angular/core";
import {map} from "rxjs/operators";
import {BreakpointObserver, Breakpoints} from "@angular/cdk/layout";

@Component({
               selector:    "app-dashboard",
               templateUrl: "./dashboard.component.html",
               styleUrls:   ["./dashboard.component.scss"]
           })
export class DashboardComponent implements OnInit {
    /** Based on the screen size, switch from standard to one column per row */
    cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
        map(({matches}) => {
            if (matches) {
                return [
                    {title: "Count By Text and Region", cols: 1, rows: 1, type: "twitter-timeseries-text-and-region", data: {}},
                    {title: "Total Count", cols: 1, rows: 1, type: "twitter-timeseries-total", data: {}},
                    {title: "Exceedence by Date", cols: 1, rows: 1, type: "twitter-timeseries-exceed", data: {}},
                    {title: "Exceedence by Region", cols: 1, rows: 1, type: "twitter-timeseries-exceed-region", data: {}},
                ];
            }

            return [
                {title: "Count By Text and Region", cols: 2, rows: 2, type: "twitter-timeseries-text-and-region", data: {}},
                {title: "Total Count", cols: 1, rows: 1, type: "twitter-timeseries-total", data: {}},
                {title: "Exceedence by Date", cols: 1, rows: 1, type: "twitter-timeseries-exceed", data: {}},
                {title: "Exceedence by Region", cols: 2, rows: 1, type: "twitter-timeseries-exceed-region", data: {}},
            ];
        })
    );

    constructor(private breakpointObserver: BreakpointObserver) {}

    public ngOnInit(): void {
        $("#loading-div").css("opacity", 0.0);
        setTimeout(() => $("#loading-div").remove(), 1000);
    }


}
