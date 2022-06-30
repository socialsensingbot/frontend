import {Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, ViewChild} from "@angular/core";
import {MetadataKeyValue} from "../../api/metadata.service";
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
import {SSMapLayer} from "../../types";
import {RESTMapDataService} from "../../map/data/rest-map-data.service";
import {MapSelectionService} from "../../map-selection.service";
import {UIExecutionService} from "../../services/uiexecution.service";

const log = new Logger("timeseries-config");

type DataType = { textSearch: string, regions: string[], layer: SSMapLayer };

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
        layer:      this.pref.defaultLayer(),
    };

    public get data(): DataType {
        return this._data;
    }


    @Input()
    public set data(value: DataType) {
        if (typeof value !== "undefined") {
            this._data = value;
            if (this._data.layer) {
                this._activeLayerGroup = this._data.layer.id;
            } else {
                log.verbose("No layer info found in the data object, using the default layer.", this.pref.defaultLayer());
                this._activeLayerGroup = this.pref.defaultLayer().id;

            }
            this.searchControl.setValue(this._data.textSearch + this.regions);
            //TODO: Remove this hardcoding
            this.mapData.regionsDropDown(this.map.id).then(
                regions => {
                    this.allRegions = regions;
                    log.verbose(regions);
                    this.filteredRegions = this.regionControl.valueChanges.pipe(
                        startWith(null),
                        map((region: string | null) => region ? this._filter(region) : this.allRegions.slice()));
                    this.regions = regions.filter(i => this._data.regions.includes(i.value));
                    this.filteredRegions.subscribe(i => {
                        log.verbose("Filtered regions: " + JSON.stringify(i));

                    });
                    log.verbose("All regions: " + JSON.stringify(this.regions));
                });
        }

    }

    private layerGroup(id: string): SSMapLayer {
        return this.pref.enabledLayers.filter(i => i.id === id)[0];
    }

    constructor(public zone: NgZone, public router: Router,
                public map: MapSelectionService,
                public exec: UIExecutionService,
                public route: ActivatedRoute, public pref: PreferenceService,
                private _api: RESTDataAPIService, public auto: TextAutoCompleteService, public mapData: RESTMapDataService
    ) {

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
        this.updateRegions()
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

    // TODO:
    // TODO: Selected chips are not being added to the regions list.
    // TODO:

    selected(event: MatAutocompleteSelectedEvent): void {
        log.debug("Event value", event.option.value);
        this.regions.push(this.allRegions.find(region => region.text === event.option.value.text.trim()));
        log.debug("Regions", this.regions);
        this.regionInput.nativeElement.value = "";
        this.regionControl.setValue(null);
        this.updateRegions();
        this.changed.emit(this._data);
    }

    public add(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;
        log.debug("Added event with value: ", value);
        // Add our region
        if ((value || "").trim()) {
            this.regions.push(this.allRegions.find(region => region.text === value.trim()));
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

        await this.searchControl.valueChanges.subscribe(async value => {
            const filterValue = value.toLowerCase();
            this.filteredAutocomplete = (await this.auto.listByOwnerOrGroup(timeSeriesAutocompleteType, filterValue)).map(
                i => i.text);
        });

        this.searchControl.setValue(this._data.textSearch);
        this.searchControl.valueChanges.subscribe(value => {
            this.textChanged();
        });
        if (this._data.layer) {
            this._activeLayerGroup = this._data.layer.id;
        } else {
            log.verbose("No layer info found in the data object, using the default layer.", this.pref.defaultLayer());
            this._activeLayerGroup = this.pref.defaultLayer().id;

        }

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
        log.debug("Updated data regions", this._data.regions);
        this.router.navigate([], {
            queryParams:         {selected: null},
            queryParamsHandling: "merge"
        });
    }

    private _filter(region: any): MetadataKeyValue[] {
        if (region && !region.text) {
            const filterValue = region.toLowerCase();
            log.debug("Topic string value is ", region);
            return this.allRegions.filter(t => t.text.toLowerCase().indexOf(filterValue) === 0);
        } else {
            log.debug("Topic selected", region);
            return region;
        }
    }
}
