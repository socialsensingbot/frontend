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

export interface LayerGroupsConfiguration {
    groups: LayerGroup[];
    defaultLayerGroup: string;
}
