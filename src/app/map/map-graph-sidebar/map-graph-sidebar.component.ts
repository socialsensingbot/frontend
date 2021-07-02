import {Component, Input, OnInit, TemplateRef, ViewChild} from "@angular/core";
import {RegionSelection} from "../region-selection";
import {MatDialog} from "@angular/material/dialog";
import {DashboardService} from "../../pref/dashboard.service";

@Component({
               selector:    "app-map-graph-sidebar",
               templateUrl: "./map-graph-sidebar.component.html",
               styleUrls:   ["./map-graph-sidebar.component.scss"]
           })
export class MapGraphSidebarComponent implements OnInit {
    @Input() selection: RegionSelection;
    @ViewChild("expandedCountGraph") expandedCountGraph: TemplateRef<any>;
    @ViewChild("expandedExceedenceGraph") expandedExceedenceGraph: TemplateRef<any>;

    public regionList: string[] = [];

    constructor(public dialog: MatDialog, public dash: DashboardService) { }

    ngOnInit(): void {
        this.regionList = this.selection.regionNames();
        this.selection.changed.subscribe(i => this.regionList = this.selection.regionNames());
    }

    public expandCountGraph() {
        const dialogRef = this.dialog.open(this.expandedCountGraph, {
            width: "800px"
        });

        dialogRef.afterClosed().subscribe(() => {
            console.log("The dialog was closed");
        });
    }

    public expandExceedenceGraph() {
        const dialogRef = this.dialog.open(this.expandedExceedenceGraph, {
            width: "800px"
        });

        dialogRef.afterClosed().subscribe(() => {
            console.log("The dialog was closed");
        });
    }

    public showDashboard() {
        window.open("/dashboard","___dashboard___");
    }
}
