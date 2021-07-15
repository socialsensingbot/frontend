import {Component, Input, OnInit, TemplateRef, ViewChild} from "@angular/core";
import {RegionSelection} from "../region-selection";
import {MatDialog} from "@angular/material/dialog";
import {DashboardService} from "../../pref/dashboard.service";
import {Logger} from "@aws-amplify/core";
const log = new Logger("map-graph-sidebar");

@Component({
               selector:    "app-map-graph-sidebar",
               templateUrl: "./map-graph-sidebar.component.html",
               styleUrls:   ["./map-graph-sidebar.component.scss"]
           })
export class MapGraphSidebarComponent implements OnInit {
    @Input() selection: RegionSelection;
    @ViewChild("expandedCountGraph") expandedCountGraph: TemplateRef<any>;
    @ViewChild("expandedExceedanceGraph") expandedExceedanceGraph: TemplateRef<any>;

    public regionList: string[] = [];

    constructor(public dialog: MatDialog, public dash: DashboardService) { }

    ngOnInit(): void {
        this.regionList = this.selection.regionNames();
        this.selection.changed.subscribe(i => this.regionList = this.selection.regionNames());
    }

    public expandCountGraph() {
        const dialogRef = this.dialog.open(this.expandedCountGraph, {
            width:  "80vw",
            height: "80vh",
            minWidth: "800px",
            minHeight: "800px",
            maxHeight: "1024px"
        });

        dialogRef.afterClosed().subscribe(() => {
            log.debug("The dialog was closed");
        });
    }

    public expandExceedanceGraph() {
        const dialogRef = this.dialog.open(this.expandedExceedanceGraph, {
            width:  "80vw",
            height: "80vh",
            minWidth: "800px",
            minHeight: "800px",
            maxHeight: "1024px"
        });

        dialogRef.afterClosed().subscribe(() => {
            log.debug("The dialog was closed");
        });
    }

    public showDashboard() {
        window.open("/dashboard", "___dashboard___");
    }
}
