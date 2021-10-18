import {Feature} from "./types";
import {toTitleCase} from "../common";
import {EventEmitter} from "@angular/core";
import {Logger} from "@aws-amplify/core";


const log = new Logger("region-selection");

export class Region {

    public name: string;
    public geometry: any;
    public exceedanceProbability: number;
    public tweetCount: number;
    public title: string;

    constructor(public feature: Feature) {
        this.name = feature.properties.name;
        // tslint:disable-next-line:no-string-literal
        this.title = feature.properties["title"];
        this.geometry = feature.geometry;
        this.exceedanceProbability = Math.round(feature.properties.stats * 100) / 100;
        this.tweetCount = feature.properties.count;
    }


    asSelector(): JQuery {
        return $(".x-feature-name-" + this.name.replace(" ", "-"));
    }


    public isNumericRegion() {
        return this.name.match(/\d+/);
    }
}

type RegionMap = { [key: string]: Region };

export class RegionSelection {

    public changed = new EventEmitter<RegionMap>();
    private regions: RegionMap = {};

    public get count(): any {
        return this.all().length;
    }

    all(): Region[] {
        return Object.values(this.regions);
    }

    features(): Feature[] {
        return Object.values(this.regions).map(i => i.feature);
    }

    clear() {
        this.regions = {};
        this.changed.emit(this.regions);

    }

    isSelected(feature: Feature) {
        return this.regionNames().includes(feature.properties.name);
    }

    toggle(feature: Feature) {
        if (this.regions[feature.properties.name]) {
            delete this.regions[feature.properties.name];
        } else {
            this.regions[feature.properties.name] = new Region(feature);
        }
        this.changed.emit(this.regions);
    }

    public selectOnly(feature: Feature) {
        this.regions = {};
        this.regions[feature.properties.name] = new Region(feature);
        this.changed.emit(this.regions);
    }

    public select(feature: Feature) {
        this.regions[feature.properties.name] = new Region(feature);
        this.changed.emit(this.regions);
    }

    public regionNames(): string[] {
        return Object.keys(this.regions);
    }

    public firstRegion(): Region {
        return this.all()[0];
    }


    public asTitleText() {
        const regions = this.regionNames();
        if (regions.length === 0) {
            return "No Regions";
        } else if (regions.length === 1) {
            return toTitleCase(regions[0]);
        } else if (regions.length < 5) {
            return regions.map(i => toTitleCase(i)).join(", ");
        } else {
            return regions.length + " Regions";
        }
    }

    public asId() {
        const regions = this.regionNames();
        return regions.join("-");


    }
}
