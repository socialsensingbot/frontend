import {Component, OnInit} from "@angular/core";
import {BreakpointObserver} from "@angular/cdk/layout";
import {DashboardCard, DashboardService} from "../pref/dashboard.service";

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
    public deviceIndex: number;

    constructor(private breakpointObserver: BreakpointObserver, public dash: DashboardService) {}

    public async ngOnInit() {
        $("#loading-div").css("opacity", 0.0);
        setTimeout(() => $("#loading-div").remove(), 1000);
        await this.dash.init();
        await this.dash.waitUntilReady();
        this.ready = true;
        console.log("Dashboard ready with ", this.dash.dashboard);
        this.initDashboard();
    }


    private initDashboard() {
        this.deviceIndex = 0;
        for (let i = 0; i < this.dash.dashboard.devices.length; i++) {
            if (this.dash.dashboard.devices[i].deviceType === "all") {
                this.deviceIndex = i;

            }
        }
        this.cards = this.dash.dashboard.devices[this.deviceIndex].pages[0].cards;
    }

    public saveCard(index: number, data: any) {
        this.dash.dashboard.devices[this.deviceIndex].pages[0].cards[index].state = data;
        this.dash.persist();
    }

    public reset() {
        this.dash.reset();
        this.initDashboard();
    }
}
