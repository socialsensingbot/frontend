import {Component, ElementRef, Inject, NgZone, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {TwitterTimeseriesComponent} from "./twitter-timeseries.component";
import {MetadataKeyValue, MetadataService} from "../../../api/metadata.service";
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {FormControl} from "@angular/forms";
import {Observable} from "rxjs";
import {MatAutocomplete, MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {map, startWith} from "rxjs/operators";
import {MatChipInputEvent} from "@angular/material/chips";
import {ActivatedRoute, Router} from "@angular/router";
import {HistoricalDataService} from "../../../api/historical-data.service";

@Component({
               selector:    "app-timeseries-config-dialog",
               templateUrl: "timeseries-config-dialog-component.html",
           })
export class TimeseriesConfigDialogComponent implements OnInit, OnDestroy {
    public allRegions: MetadataKeyValue[];
    public separatorKeysCodes: number[] = [ENTER, COMMA];
    public regionControl = new FormControl();
    public filteredRegions: Observable<MetadataKeyValue[]>;
    public regions: MetadataKeyValue[];
    @ViewChild("regionInput") regionInput: ElementRef<HTMLInputElement>;
    @ViewChild("auto") matAutocomplete: MatAutocomplete;
    public searchControl = new FormControl();

    constructor(public metadata: MetadataService, public zone: NgZone, public router: Router,
                public route: ActivatedRoute,
                private _api: HistoricalDataService,
                public dialogRef: MatDialogRef<TimeseriesConfigDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: TwitterTimeseriesComponent) {}

    onNoClick(): void {
        this.dialogRef.close();
    }

    public selectAllRegions() {
        this.regions = [...this.allRegions];
        this.data.markChanged();
    }

    public clearRegions() {
        this.regions = [];
        this.data.markChanged();
    }

    remove(selectedTopic: MetadataKeyValue): void {
        try {
            const index = this.regions.indexOf(selectedTopic);
            if (index >= 0) {
                this.regions.splice(index, 1);
            }
            this.updateRegions();
            this.data.markChanged();
        } catch (e) {
            console.error(e);
        }
    }

    selected(event: MatAutocompleteSelectedEvent): void {
        console.log("Event value", event.option.value);
        this.regions.push(this.allRegions.find(region => region.value === event.option.value.value.trim()));
        this.regionInput.nativeElement.value = "";
        this.regionControl.setValue(null);
        this.updateRegions();
        this.data.markChanged();
    }

    public add(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;
        console.log(value);
        // Add our topic
        if ((value || "").trim()) {
            this.regions.push(this.allRegions.find(topic => topic.value === value.trim()));
        }

        // Reset the input value
        if (input) {
            input.value = "";
        }

        this.regionControl.setValue(null);
        this.updateRegions();
        this.data.markChanged();
    }

    public ngOnDestroy(): void {
    }

    async ngOnInit() {
        // this._interval = this.startChangeTimer();
        this.allRegions = (await this.metadata.regions);
        this.regions = this.allRegions.filter(i => this.data.query.regions.includes(i.value));
        this.filteredRegions = this.regionControl.valueChanges.pipe(
            startWith(null),
            map((region: string | null) => region ? this._filter(region) : this.allRegions.slice()));
        this.searchControl.valueChanges.subscribe(value => {this.data.markChanged();});

    }

    private updateRegions() {
        if (this.regions) {
            this.data.query.regions = this.regions.map(i => i.value);
        }
    }

    private _filter(topic: any): MetadataKeyValue[] {
        if (topic && !topic.value) {
            const filterValue = topic.toLowerCase();
            console.log("Topic string value is ", topic);
            return this.allRegions.filter(t => t.value.toLowerCase().indexOf(filterValue) === 0);
        } else {
            console.log("Topic selected", topic);
            return topic;
        }
    }


}
