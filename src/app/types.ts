/**
 * The data layer used in maps. At present only a single layer is displayed at once on the map. A layer
 * is a combination of sources, hazards and whether warnings are included.
 */
export interface SSMapLayer {
    title: string;
    id: string;
    sources: string[];
    hazards: string[];
    warnings: "include" | "exclude" | "only";
}

/**
 * This is the type of the data stored in user/group preferences under 'layers'
 * @see environment.ts
 */
export interface SSLayerConfiguration {
    available: SSMapLayer[];
    defaultLayer: string;
}
