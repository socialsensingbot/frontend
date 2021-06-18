import {Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, ViewChild} from "@angular/core";
import {StandardGraphComponent} from "../../standard-graph-component";
import {MetadataKeyValue, MetadataService} from "../../../api/metadata.service";
import {ActivatedRoute, Router} from "@angular/router";
import {HistoricalDataService} from "../../../api/historical-data.service";
import {MatChipInputEvent} from "@angular/material/chips";
import {MatAutocomplete, MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {FormControl} from "@angular/forms";
import {Observable} from "rxjs";
import {map, startWith} from "rxjs/operators";

@Component({
               selector:    "app-twitter-timeseries",
               templateUrl: "./twitter-timeseries.component.html",
               styleUrls:   ["./twitter-timeseries.component.scss"]
           })
export class TwitterTimeseriesComponent extends StandardGraphComponent implements OnInit, OnDestroy {

    @Input()
    public height: number;

    @Input()
    public query: {
        dateStep?: number;
        to?: number;
        from?: number;
        location?: string;
        regions: string[];
    } = {regions: []};

    @Output()
    public changed = new EventEmitter();

    allRegions: MetadataKeyValue[];
    separatorKeysCodes: number[] = [ENTER, COMMA];
    regionControl = new FormControl();
    filteredRegions: Observable<MetadataKeyValue[]>;
    regions: MetadataKeyValue[];
    @ViewChild("regionInput") topicInput: ElementRef<HTMLInputElement>;
    @ViewChild("auto") matAutocomplete: MatAutocomplete;
    public removable = true;
    private interval: number;

    constructor(metadata: MetadataService, zone: NgZone, router: Router, route: ActivatedRoute,
                _api: HistoricalDataService) {
        super(metadata, zone, router, route, _api, "count_by_date_for_all_regions", false);
    }

    public ngOnDestroy(): void {
        window.clearInterval(this._interval);
    }


    async ngOnInit() {
        this._interval = this.startChangeTimer();
        this.allRegions = (await this.metadata.regions);
        this.regions = this.allRegions.filter(i => this.query.regions.includes(i.value));
        this.filteredRegions = this.regionControl.valueChanges.pipe(
            startWith(null),
            map((region: string | null) => region ? this._filter(region) : this.allRegions.slice()));
        this.interval = window.setInterval(() => {
            this._zone.run(() => {
                if (this._changed) {
                    this._changed = false;
                    this.emitChange();
                }
            });
        }, 200);
    }

    public emitChange() {
        if (this.regions) {
            this.query.regions = this.regions.map(i => i.value);
        }
        this.changed.emit(this.query);
    }

    public markChanged() {
        this._changed = true;
    }

    add(event: MatChipInputEvent): void {
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
        this.markChanged();
    }

    remove(selectedTopic: MetadataKeyValue): void {
        try {
            const index = this.regions.indexOf(selectedTopic);
            if (index >= 0) {
                this.regions.splice(index, 1);
            }
            this.markChanged();
        } catch (e) {
            console.error(e);
        }
    }

    selected(event: MatAutocompleteSelectedEvent): void {
        console.log("Event value", event.option.value);
        this.regions.push(this.allRegions.find(region => region.value === event.option.value.value.trim()));
        this.topicInput.nativeElement.value = "";
        this.regionControl.setValue(null);
        this.markChanged();
    }

    public selectAllRegions() {
        this.regions = [...this.allRegions];
        this.markChanged();
    }

    public clearRegions() {
        this.regions = [];
        this.markChanged();
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
