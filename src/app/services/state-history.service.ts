import {Injectable} from "@angular/core";
import {Logger} from "@aws-amplify/core";
import {NotificationService} from "./notification.service";
import {DataStore} from "@aws-amplify/datastore";
import {StateHistory} from "../../models";
import {PreferenceService} from "../pref/preference.service";

const log = new Logger("state-history-service");

@Injectable({
                providedIn: "root"
            })
export class StateHistoryService {


    constructor(private _notify: NotificationService, private _prefs: PreferenceService) {

    }

    private _groups: string[] = [];

    public get groups(): string[] {
        return this._groups;
    }

    public async create(type: string, title: string, state: any, forOwner = true,
                        forGroup = false): Promise<StateHistory> {
        return await DataStore.save(new StateHistory({
                                                         type,
                                                         title,
                                                         state: JSON.stringify(state),
                                                         owner: forOwner ? await this._prefs.username : null,
                                                         group: forOwner ? this._groups[0] : null
                                                     }));
    }

    public async update(id: string, title: string, state: any): Promise<StateHistory> {
        const stateHistory = await this.get(id);
        return await DataStore.save(StateHistory.copyOf(stateHistory, m => {
            m.title = title;
            m.state = JSON.stringify(state);
        }));
    }


    public async get(id: string): Promise<StateHistory> {
        const results = await DataStore.query(StateHistory, q => q.id("eq", id));
        if (results.length === 0) {
            console.error("No such history ", id);
            throw Error("No such state history " + id);
        } else {
            console.log(results);
            return results[0];
        }
    }

    public async delete(id: string): Promise<StateHistory> {
        const results = await DataStore.delete(StateHistory, q => q.id("eq", id));
        if (results.length === 0) {
            throw Error("No such state history " + id);
        } else {
            return results[0];
        }
    }

    public async listByOwner(): Promise<StateHistory[]> {
        const username = await this._prefs.username;
        return await DataStore.query(StateHistory, q => q.owner("eq", username));
    }

    public async listByGroup(): Promise<StateHistory[]> {
        return await DataStore.query(StateHistory, q => q.group("eq", this._groups[0]));
    }


    public async init() {


    }


}
