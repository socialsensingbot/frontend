import * as geojson from "geojson";


export interface RegionMetadata {
    id: string;
    title: string;
    key: string;
}


export interface LayerMetadata {
    id: string;
    /**
     * which data source does this come from e.g. pollution-monitoring, twitter
     */
    source: string;
    /**
     * What hazard does this data represent if any e.g. flood, pollution.
     */
    hazard?: string;
    /**
     * Where, relative to the top level public dir in S3, can we find this layer's data.
     */
    file: string;
}

/**
 * The layer group consists of a set of layers grouped together to form one visual result.
 */
export interface LayerGroupMetadata {
    id: string;
    title: string;
    layers: string[];
}

export interface StartMetadata {
    "lat": number;
    "lng": number;
    "zoom": number;
}


export interface MapMetadata {
    id: string;
    title: string;
    version?: string;
    regionTypes: RegionMetadata[];
    layerGroups: LayerGroupMetadata[];
    regionAggregations: string[];
    layers: LayerMetadata[];
    start: StartMetadata;
    location: string;
    hazards: string[];
    defaultLayerGroup: string;
    defaultRegionType: string;
}

export interface MapCoreMetadata {
    id: string;
    title: string;
}

export interface ServiceMetadata {
    version?: string;
    maps: MapCoreMetadata[];
    start?: StartMetadata;
}

export const ONE_DAY = 24 * 60 * 60 * 1000;

export interface AggregationRegion {
    id: string;
    title: string;
    regionTypeMap: {
        [regionType: string]: (string | number)[];
    };
}

export interface AggregationData {
    aggregates: AggregationRegion[];
}

export interface RegionTweeCount {
    [region: string]: number;
}


export class TweetMap {
    [index: string]: any[];
}

export class CountMap {
    [index: string]: number;
}

export class ExceedanceMap {
    [index: string]: number;
}


export interface RegionGeography {
    [regionName: string]: geojson.GeoJsonObject;

}

export interface AggregationMap {[aggregationName: string]: AggregationData}

export interface RegionStats {
    count: number;
    exceedance: number;
}

export interface RegionStatsMap {
    [regionName: string]: RegionStats;
}
