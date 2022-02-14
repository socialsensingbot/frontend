import * as geojson from "geojson";

export interface Properties {
    name: string;
    count: number;
    exceedance?: number;
}

export interface Geometry {
  coordinates: number[][][];
  type: string;
}

export interface Feature {
  properties: Properties;
  geometry: Geometry;
  id: string;
  type: string;
}

export interface PolygonData extends geojson.GeoJsonObject {
  // type: string;
  features: Feature[];
}


export interface PolyLayers {
  county: any;
  coarse: any;
  fine: any;
}

export interface NumberLayers {
    "exceedance": any;
    "count": any;
}

export interface RegionData<R, S, T> {
    exceedance: R;
    count: S;
    embed?: T;
}

export interface ColorFunctionObject {
  getColor();

  getFeatureStyle(feature: geojson.Feature<geojson.GeometryObject, any>);
}

export type ColorFunctions = RegionData<ColorFunctionObject, ColorFunctionObject, ColorFunctionObject>;
export type ColorData = RegionData<{ colors: string[], values: number[] }, { colors: string[], values: number[] }, any>;
export interface ByRegionType<T> {
  [index: string]: T;
}
export type Stats = ByRegionType<RegionData<any, any, any>>;

export type NumberLayerShortName = "exceedance" | "count";

export const numberLayerShortNames: NumberLayerShortName[] = ["exceedance", "count"];


export const COUNTY = "county";

// TODO: types for the data
export class TimeSlice {
    [index: string]: any;

    tweets: string[];
}


export class DateRangeSliderOptions {
    min: number;
    max: number;
    currentWindowMin?: number;
    currentWindowMax?: number;
    startMin: number;
    startMax: number;
    now: number;
}
