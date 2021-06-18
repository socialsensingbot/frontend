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
                    {title: "Timeseries", cols: 1, rows: 1, type: "twitter-timeseries", data: {}},
                    {title: "Card 2", cols: 1, rows: 1, type: "blank", data: {}},
                    {title: "Card 3", cols: 1, rows: 1, type: "blank", data: {}},
                    {title: "Card 4", cols: 1, rows: 1, type: "blank", data: {}}
                ];
            }

            return [
                {title: "Tweets by Date", cols: 2, rows: 1, type: "twitter-timeseries", data: {}},
                {title: "Card 2", cols: 1, rows: 1, type: "blank", data: {}},
                {title: "Card 3", cols: 1, rows: 2, type: "blank", data: {}},
                {title: "Card 4", cols: 1, rows: 1, type: "blank", data: {}}
            ];
        })
    );

    constructor(private breakpointObserver: BreakpointObserver) {}

    public ngOnInit(): void {
        $("#loading-div").css("opacity", 0.0);
    }


}
