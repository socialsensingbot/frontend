import * as geojson from "geojson";

export interface Properties {
  name: string;
  count: number;
  stats?: number;
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
  "stats": any;
  "count": any;
}

export interface RegionData<R, S, T> {
  stats: R;
  count: S;
  embed?: T;
}

export interface ColorFunctionObject {
  getColor();

  getFeatureStyle(feature: geojson.Feature<geojson.GeometryObject, any>);
}

export type ColorFunctions = RegionData<ColorFunctionObject, ColorFunctionObject, ColorFunctionObject>;
export type ColorData = RegionData<{ colors: string[], values: number[] }, { colors: string[], values: number[] }, any>;
export type ByRegionType<T> = {
  [index in PolygonLayerShortName]: T;
};
export type Stats = ByRegionType<RegionData<any, any, any>>;

export type PolygonLayerFullName = "Local Authority" | "Coarse Grid" | "Fine Grid";
export type PolygonLayerShortName = "county" | "coarse" | "fine";
export type NumberLayerShortName = "stats" | "count" ;
export type NumberLayerFullName = "Exceedance" | "Tweet Count" ;

export const polygonLayerFullNames: PolygonLayerFullName[] = ["Local Authority", "Coarse Grid", "Fine Grid"];
export const polygonLayerShortNames: PolygonLayerShortName[] = ["county", "coarse", "fine"];
export const numberLayerFullNames: NumberLayerFullName[] = ["Exceedance", "Tweet Count"];
export const numberLayerShortNames: NumberLayerShortName[] = ["stats", "count"];

export const regionDataKeys: string[] = ["stats", "count", "embed"];
// These are provided as constants to reduce the chance of typos changing functionality

export const STATS = "stats";
export const COUNTY = "county";

// TODO: types for the data
export class TimeSlice {
  [index: string]: any;

  tweets: string[];
}

