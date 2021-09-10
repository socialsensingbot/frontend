export interface LayerGroup {
    title: string;
    sources: string[];
    hazards: string[];
    warnings: "include" | "exclude" | "only";
}

export interface LayerGroupsMap {
    [id: string]: LayerGroup;
}

export interface LayerGroupsConfiguration {
    groups: LayerGroupsMap;
    default: string;
}
