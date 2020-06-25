import {Feature} from "./types";
import {toTitleCase} from "../common";

export class Region {
  asSelector(): JQuery {
    return $(".x-feature-name-" + this.name.replace(" ", "-"));
  }

  public get title(): any {
    return toTitleCase(this.name);
  }

  public name: any;
  public geometry: any;
  public exceedanceProbability: number;
  public tweetCount: number;

  constructor(public feature: Feature) {
    this.name = feature.properties.name;
    this.geometry = feature.geometry
    this.exceedanceProbability = Math.round(feature.properties.stats * 100) / 100;
    this.tweetCount = feature.properties.count;
  }


  public isNumericRegion() {
    return this.name.match(/\d+/);
  }
}

export class RegionSelection {
  public get count(): any {
    return this.all().length;
  }

  l


  all(): Region[] {
    return Object.values(this.regions);
  }

  features(): Feature[] {
    return Object.values(this.regions).map(i => i.feature);
  }

  clear() {
    this.regions = {};
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
  }

  public regions: { [key: string]: Region } = {};

  public select(feature: Feature) {
    this.regions = {};
    this.regions[feature.properties.name] = new Region(feature);
  }

  public regionNames(): string[] {
    return Object.keys(this.regions);
  }

  public firstRegion(): Region {
    return this.all()[0];
  }
}
