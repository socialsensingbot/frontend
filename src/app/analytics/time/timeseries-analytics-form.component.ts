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
import {TextAutoCompleteService} from "../../services/text-autocomplete.service";
import {timeSeriesAutocompleteType} from "../timeseries";
import {LayerGroup} from "../../types";

const log = new Logger("timeseries-config");

type DataType = { textSearch: string, regions: string[], layer: LayerGroup };

@Component({
               selector:    "app-timeseries-analytics-form",
               styleUrls:   ["./timeseries-analytics-form.component.scss"],
               templateUrl: "timeseries-analytics-form.component.html",
           })
export class TimeseriesAnalyticsFormComponent implements OnInit, OnDestroy {
    public allRegions: MetadataKeyValue[] = [];
    public separatorKeysCodes: number[] = [ENTER, COMMA];
    public regionControl = new FormControl();
    public filteredRegions: Observable<MetadataKeyValue[]>;
    public regions: MetadataKeyValue[] = [];
    @ViewChild("regionInput") regionInput: ElementRef<HTMLInputElement>;
    @ViewChild("auto") matAutocomplete: MatAutocomplete;
    public searchControl = new FormControl();
    @Output()
    public changed = new EventEmitter<any>();
    public filteredAutocomplete: string[];


    private _activeLayerGroup: string;

    public get activeLayerGroup(): string {
        return this._activeLayerGroup;
    }

    public set activeLayerGroup(value: string) {
        this._activeLayerGroup = value;
        this._data.layer = this.layerGroup(value);
        this.changed.emit(this._data);
    }

    private _data: DataType = {
        textSearch: "",
        regions:    [],
        layer:      this.pref.combined.layers.defaultLayer,
    };

    public get data(): DataType {
        return this._data;
    }

    @Input()
    public set data(value: DataType) {
        if (typeof value !== "undefined") {
            this._data = value;
            this.activeLayerGroup = this._data.layer.id || this.pref.combined.layers.defaultLayer;
            this.searchControl.setValue(this._data.textSearch + this.regions);
            this.metadata.regions.then(
                regions => {
                    this.allRegions = regions;
                    log.debug(regions);
                    this.regions = regions.filter(i => this._data.regions.includes(i.value));
                });
        }

    }

    private layerGroup(id: string): LayerGroup {
        return this.pref.combined.layers.available.filter(i => i.id === id)[0];
    }

    constructor(public metadata: MetadataService, public zone: NgZone, public router: Router,
                public route: ActivatedRoute, public pref: PreferenceService,
                private _api: RESTDataAPIService, public auto: TextAutoCompleteService
    ) {

        this.metadata.regions.then(i => this.allRegions = i);
    }

    onNoClick(): void {
        // this.dialogRef.close();
    }

    public selectAllRegions() {
        this.regions = [...this.allRegions];
        this.changed.emit(this._data);
    }

    public clearRegions() {
        this.regions = [];
        if (this._data) {
            this._data.regions = [];
            this.changed.emit(this._data);
        }
    }

    remove(selectedTopic: MetadataKeyValue): void {
        try {
            const index = this.regions.indexOf(selectedTopic);
            if (index >= 0) {
                this.regions.splice(index, 1);
            }
            this.updateRegions();
            this.changed.emit(this._data);
        } catch (e) {
            log.error(e);
        }
    }

    selected(event: MatAutocompleteSelectedEvent): void {
        log.debug("Event value", event.option.value);
        this.regions.push(this.allRegions.find(region => region.value === event.option.value.value.trim()));
        log.debug("Regions", this.regions);
        this.regionInput.nativeElement.value = "";
        this.regionControl.setValue(null);
        this.updateRegions();
        this.changed.emit(this._data);
    }

    public add(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;
        log.debug(value);
        // Add our region
        if ((value || "").trim()) {
            this.regions.push(this.allRegions.find(region => region.value === value.trim()));
            log.debug("Add Regions", this.regions);

        }

        // Reset the input value
        if (input) {
            input.value = "";
        }

        this.regionControl.setValue(null);
        this.updateRegions();
        this.changed.emit(this._data);
    }

    public ngOnDestroy(): void {
    }

    async ngOnInit() {
        // this._interval = this.startChangeTimer();
        //
        // if (this._data.regions) {
        //   this.regions = this.allRegions.filter(i => this._data.regions.includes(i.value));
        // }
        await this.pref.waitUntilReady();
        this.filteredRegions = this.regionControl.valueChanges.pipe(
            startWith(null),
            map((region: string | null) => region ? this._filter(region) : this.allRegions.slice()));
        await this.searchControl.valueChanges.subscribe(async value => {
            const filterValue = value.toLowerCase();
            this.filteredAutocomplete = (await this.auto.listByOwnerOrGroup(timeSeriesAutocompleteType, filterValue)).map(
                i => i.text);
        });

        this.searchControl.setValue(this._data.textSearch);
        this.searchControl.valueChanges.subscribe(value => {
            this.textChanged();
        });
        this.activeLayerGroup = this._data.layer.id || this.pref.combined.layers.defaultLayer;

    }


    public clearTextSearch() {
        if (this._data) {
            this._data.textSearch = "";
            this.searchControl.setValue(this._data.textSearch);
            this.changed.emit(this._data);
        }
    }

    public textChanged() {
        if (this._data) {
            log.debug("Text Changed");
            this._data.textSearch = this.searchControl.value;
            this.changed.emit(this._data);
        }
    }

    public clearForm() {

        this.searchControl.setValue("");
        this.regions = [];

    }

    private updateRegions() {
        if (this.regions) {
            log.debug("Update Regions", this.regions);
            this._data.regions = this.regions.map(i => i.value);
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
