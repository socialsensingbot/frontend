/*
 * © 2020 All rights reserved.
 */

import {Injectable} from "@angular/core";
import {Logger} from "@aws-amplify/core";
import {RESTDataAPIService} from "./rest-api.service";

const log = new Logger("metadata-api");

export interface MetadataKeyValue {
    text: string;
    value: string;
    level?: number;
}


@Injectable({
                providedIn: "root"
            })

export class MetadataService {
    regions: Promise<MetadataKeyValue[]>;


    constructor(_api: RESTDataAPIService) {
        this.regions = _api.callQueryAPI("refdata", {name: "regions"}, 60, () => false);
    }

}
