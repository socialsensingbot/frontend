/*
 * © 2020 All rights reserved.
 */

import {Injectable} from '@angular/core';
import {HistoricalDataService} from "./historical-data.service";

export interface MetadataKeyValue {
  text: string;
  value: string;
}

export interface JobTitle {
  title: string;
}

@Injectable({
  providedIn: 'root'
})

export class MetadataService  {
   nuts1: Promise<MetadataKeyValue[]>;
   nuts2: Promise<MetadataKeyValue[]>;
   nuts3: Promise<MetadataKeyValue[]>;
   topics: Promise<MetadataKeyValue[]>;
   jobTitles: Promise<JobTitle[]>;


  constructor(_api:HistoricalDataService) {
    this.nuts1 =  _api.callAPI("refdata",  {name:"nuts1"});
    this.nuts2 =  _api.callAPI("refdata",  {name:"nuts2"});
    this.nuts3 =  _api.callAPI("refdata",  {name:"nuts3"});
    this.topics =  _api.callAPI("refdata",  {name:"topic"});
    this.jobTitles =  _api.callAPI("refdata",  {name:"job_titles"});
  }

}
