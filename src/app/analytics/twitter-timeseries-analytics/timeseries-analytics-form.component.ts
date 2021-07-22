import {Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, ViewChild} from "@angular/core";
import {MetadataKeyValue, MetadataService} from "../../api/metadata.service";
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {FormControl} from "@angular/forms";
import {Observable} from "rxjs";
import {MatAutocomplete, MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {map, startWith} from "rxjs/operators";
import {MatChipInputEvent} from "@angular/material/chips";
import {ActivatedRoute, Router} from "@angular/router";
import {Logger} from "@aws-amplify/core";
import {RESTDataAPIService} from "../../api/rest-api.service";
import {PreferenceService} from "../../pref/preference.service";

const log = new Logger("timeseries-config");

@Component({
               selector:    "app-timeseries-analytics-form",
               styleUrls:   ["./timeseries-analytics-form.component.scss"],
               templateUrl: "timeseries-analytics-form.component.html",
           })
export class TimeseriesAnalyticsFormComponent implements OnInit, OnDestroy {
    public allRegions: MetadataKeyValue[];
    public separatorKeysCodes: number[] = [ENTER, COMMA];
    public regionControl = new FormControl();
    public filteredRegions: Observable<MetadataKeyValue[]>;
    public regions: MetadataKeyValue[] = [];
    @ViewChild("regionInput") regionInput: ElementRef<HTMLInputElement>;
    @ViewChild("auto") matAutocomplete: MatAutocomplete;
    public searchControl = new FormControl();
    @Output()
    public changed = new EventEmitter<any>();
    @Input()
    public data: { textSearch: string, regions: string[] } = {textSearch: "", regions: []};

    constructor(public metadata: MetadataService, public zone: NgZone, public router: Router,
                public route: ActivatedRoute, public pref: PreferenceService,
                private _api: RESTDataAPIService,
    ) {}

    onNoClick(): void {
        // this.dialogRef.close();
    }

    public selectAllRegions() {
        this.regions = [...this.allRegions];
        this.changed.emit(this.data);
    }

    public clearRegions() {
        this.regions = [];
        if (this.data) {
            this.data.regions = [];
            this.changed.emit(this.data);
        }
    }

    remove(selectedTopic: MetadataKeyValue): void {
        try {
            const index = this.regions.indexOf(selectedTopic);
            if (index >= 0) {
                this.regions.splice(index, 1);
            }
            this.updateRegions();
            this.changed.emit(this.data);
        } catch (e) {
            log.error(e);
        }
    }

    selected(event: MatAutocompleteSelectedEvent): void {
        log.debug("Event value", event.option.value);
        this.regions.push(this.allRegions.find(region => region.value === event.option.value.value.trim()));
        this.regionInput.nativeElement.value = "";
        this.regionControl.setValue(null);
        this.updateRegions();
        this.changed.emit(this.data);
    }

    public add(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;
        log.debug(value);
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
        this.changed.emit(this.data);
    }

    public ngOnDestroy(): void {
    }

    async ngOnInit() {
        // this._interval = this.startChangeTimer();
        this.allRegions = (await this.metadata.regions);
        if (this.data.regions) {
            this.regions = this.allRegions.filter(i => this.data.regions.includes(i.value));
        }
        this.filteredRegions = this.regionControl.valueChanges.pipe(
            startWith(null),
            map((region: string | null) => region ? this._filter(region) : this.allRegions.slice()));
        this.searchControl.setValue(this.data.textSearch);
        this.searchControl.valueChanges.subscribe(value => {this.textChanged();});

    }

    public clearTextSearch() {
        if (this.data) {
            this.data.textSearch = "";
            this.searchControl.setValue(this.data.textSearch);
            this.changed.emit(this.data);
        }
    }

    public textChanged() {
        if (this.data) {
            log.debug("Text Changed");
            this.data.textSearch = this.searchControl.value;
            this.changed.emit(this.data);
        }
    }

    public clearForm() {

        this.searchControl.setValue("");
        this.regions = [];

    }

    private updateRegions() {
        if (this.regions) {
            this.data.regions = this.regions.map(i => i.value);
        }
    }

    private _filter(region: any): MetadataKeyValue[] {
        if (region && !region.value) {
            const filterValue = region.toLowerCase();
            log.debug("Topic string value is ", region);
            return this.allRegions.filter(t => t.value.toLowerCase().indexOf(filterValue) === 0);
        } else {
            log.debug("Topic selected", region);
            return region;
        }
    }
}
