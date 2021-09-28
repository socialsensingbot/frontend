export interface LayerGroup {
    title: string;
    id: string;
    sources: string[];
    hazards: string[];
    warnings: "include" | "exclude" | "only";
}

export interface LayerGroupsMap {
    [id: string]: LayerGroup;
}

export interface InfoLayerConfiguration {
    available: LayerGroup[];
    defaultLayer: string;
}
