
  export interface Properties {
    name: string;
    count: number;
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

  export interface PolygonData {
    type: string;
    features: Feature[];
  }

