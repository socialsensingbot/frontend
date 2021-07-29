import {Injectable} from "@angular/core";
import {Logger} from "@aws-amplify/core";
import {NotificationService} from "./notification.service";
import {DataStore, SortDirection} from "@aws-amplify/datastore";
import {TextAutocomplete} from "../../models";
import {PreferenceService} from "../pref/preference.service";

const log = new Logger("autocomplete-service");

@Injectable({
              providedIn: "root"
            })
export class TextAutoCompleteService {


  constructor(private _notify: NotificationService, private _prefs: PreferenceService) {

  }


  public async create(type: string, text: string, forOwner = true,
                      forGroup = false): Promise<TextAutocomplete> {
    const owner = forOwner ? await this._prefs.username : null;
    const group = forGroup ? this._prefs.groups[0] : null;
    const results = await DataStore.query(TextAutocomplete,
                                          q => q.or(r => r.owner("eq", owner).group("eq", group))
                                                .text("eq", text)
                                                .type("eq", type)
    );
    if (results.length === 0) {
      return await DataStore.save(new TextAutocomplete({type, text, owner, group}));
    } else {
      return results[0];
    }
  }

  public async update(id: string, title: string, text: string): Promise<TextAutocomplete> {
    const autocomplete = await this.get(id);
    return await DataStore.save(TextAutocomplete.copyOf(autocomplete, m => {
      m.text = text;
    }));
  }


  public async get(id: string): Promise<TextAutocomplete | null> {
    const results = await DataStore.query(TextAutocomplete, q => q.id("eq", id));
    if (results.length === 0) {
      return null;
    } else {
      console.log(results);
      return results[0];
    }
  }

  public async delete(id: string): Promise<TextAutocomplete> {
    const results = await DataStore.delete(TextAutocomplete, q => q.id("eq", id));
    if (results.length === 0) {
      throw Error("No such state history " + id);
    } else {
      return results[0];
    }
  }

  public async listByOwner(type: string, prefix: string): Promise<TextAutocomplete[]> {
    const username = await this._prefs.username;
    return await DataStore.query(TextAutocomplete, q => q.owner("eq", username).text("beginsWith", prefix)
                                                         .type("eq", type));
  }

  public async listByGroup(type: string, prefix: string): Promise<TextAutocomplete[]> {
    return await DataStore.query(TextAutocomplete,
                                 q => q.group("eq", this._prefs.groups[0]).text("beginsWith", prefix)
                                       .type("eq", type));
  }

  public async listByOwnerOrGroup(type: string, prefix: string): Promise<TextAutocomplete[]> {
    const username = await this._prefs.username;
    return await DataStore.query(TextAutocomplete,
                                 q => q.or(r => r.owner("eq", username).group("eq", this._prefs.groups[0]))
                                       .text("beginsWith", prefix)
                                       .type("eq", type),
                                 {sort: s => s.text(SortDirection.ASCENDING)}
    );
  }

  public async init() {


  }


}
