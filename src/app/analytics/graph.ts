import {TimeseriesRESTQuery} from "./timeseries";

export const toLabel = (query: TimeseriesRESTQuery, layerGroups): string => {
    if (query.textSearch.length === 0 && query.regions.length === 0) {
        if (query.layer && layerGroups.groups.length > 0) {
            return query.layer.id;
        } else {
            return "all";
        }
    }
    let label = query.textSearch;
    if (query.regions.length < 4) {
        for (const region of query.regions) {
            if (label.length !== 0) {
                label = region + " - " + label;
            } else {
                label = region;
            }
        }
    } else {
        if (label.length !== 0) {
            label = query.regions.length + " regions - " + label;
        } else {
            label = query.regions.length + " regions";
        }
    }
    if (query.layer && query.layer.id !== layerGroups.defaultLayerGroup) {
        label = label + "-" + query.layer.id;
    }

    return label;
}
