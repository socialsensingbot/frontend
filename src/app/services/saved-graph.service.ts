import {Injectable} from "@angular/core";
import {Logger} from "@aws-amplify/core";
import {NotificationService} from "./notification.service";
import {DataStore} from "@aws-amplify/datastore";
import {SavedGraph} from "../../models";
import {PreferenceService} from "../pref/preference.service";

const log = new Logger("state-history-service");

/**
 * Encapsulates the mechanics of CRUD operations on Saved Graphs.
 * These graphs are used by the analytics graphs.
 *
 * @see SavedGraph
 */
@Injectable({
                providedIn: "root"
            })
export class SavedGraphService {


    constructor(private _notify: NotificationService, private _prefs: PreferenceService) {

    }

    private _groups: string[] = [];

    public get groups(): string[] {
        return this._groups;
    }

    public async create(type: string, title: string, state: any, forOwner = true,
                        forGroup = false): Promise<SavedGraph> {
        return await DataStore.save(new SavedGraph({
                                                       type,
                                                       title,
                                                       state: JSON.stringify(state),
                                                       owner: forOwner ? await this._prefs.username : null,
                                                       group: forOwner ? this._groups[0] : null
                                                   }));
    }

    public async update(id: string, title: string, state: any): Promise<SavedGraph> {
        const savedGraph = await this.get(id);
        return await DataStore.save(SavedGraph.copyOf(savedGraph, m => {
            m.title = title;
            m.state = JSON.stringify(state);
        }));
    }


    public async get(id: string): Promise<SavedGraph | null> {
        const results = await DataStore.query(SavedGraph, q => q.id("eq", id));
        if (results.length === 0) {
            return null;
        } else {
            console.log(results);
            return results[0];
        }
    }

    public async delete(id: string): Promise<SavedGraph> {
        const results = await DataStore.delete(SavedGraph, q => q.id("eq", id));
        if (results.length === 0) {
            throw Error("No such state history " + id);
        } else {
            return results[0];
        }
    }

    public async listByOwner(): Promise<SavedGraph[]> {
        const username = await this._prefs.username;
        return await DataStore.query(SavedGraph, q => q.owner("eq", username));
    }

    public async listByGroup(): Promise<SavedGraph[]> {
        return await DataStore.query(SavedGraph, q => q.group("eq", this._groups[0]));
    }


    public async init() {


    }


}
