import {Feature} from "./types";
import {toTitleCase} from "../common";

export class Region {

  public get title(): any {
    return toTitleCase(this.name);
  }

  constructor(public feature: Feature) {
    this.name = feature.properties.name;
    this.geometry = feature.geometry;
    this.exceedanceProbability = Math.round(feature.properties.stats * 100) / 100;
    this.tweetCount = feature.properties.count;
  }

  public name: any;
  public geometry: any;
  public exceedanceProbability: number;
  public tweetCount: number;

  asSelector(): JQuery {
    return $(".x-feature-name-" + this.name.replace(" ", "-"));
  }


  public isNumericRegion() {
    return this.name.match(/\d+/);
  }
}

export class RegionSelection {
  public get count(): any {
    return this.all().length;
  }

  public regions: { [key: string]: Region } = {};

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

  public selectOnly(feature: Feature) {
    this.regions = {};
    this.regions[feature.properties.name] = new Region(feature);
  }

  public select(feature: Feature) {
    this.regions[feature.properties.name] = new Region(feature);
  }

  public regionNames(): string[] {
    return Object.keys(this.regions);
  }

  public firstRegion(): Region {
    return this.all()[0];
  }

  public regionMap() {
    const regionMap = {};
    for (const r of this.all()) {
      let regionName = `${r.title}`;

      if (r.isNumericRegion()) {
        let minX = null;
        let maxX = null;
        let minY = null;
        let maxY = null;
        for (const point of r.geometry.coordinates[0]) {
          if (minX === null || point[0] < minX) {
            minX = point[0];
          }
          if (minY === null || point[1] < minY) {
            minY = point[1];
          }
          if (maxX === null || point[0] > maxX) {
            maxX = point[0];
          }
          if (maxY === null || point[1] > maxY) {
            maxY = point[1];
          }
        }
        console.log(
          `Bounding box of ${JSON.stringify(r.geometry.coordinates[0])} is (${minX},${minY}) to (${maxX},${maxY})`);
        regionName = `(${minX},${minY}),(${maxX},${maxY})`;
        regionMap[r.name] = regionName;
      } else {
        regionMap[r.name] = toTitleCase(regionName);
      }

    }
    return regionMap;
  }
}
