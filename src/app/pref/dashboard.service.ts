import {Injectable} from "@angular/core";
import {Logger} from "@aws-amplify/core";
import {NotificationService} from "../services/notification.service";
import {environment} from "../../environments/environment";
import {DataStore} from "@aws-amplify/datastore";
import {GroupDashboard, UserDashboard} from "../../models";
import Auth from "@aws-amplify/auth";
import {PreferenceService} from "./preference.service";

const log = new Logger("dashboard-service");

export interface DashboardCard {
    variant?: string;
    hidden?: boolean;
    title: string;
    cols: number;
    rows: number;
    type: string;
    state: any;
}

export interface DashboardPage {
    title: string;
    cards: DashboardCard[];
}

export interface DashboardDeviceDefinition {
    deviceType: string;
    pages: DashboardPage[];
}

export interface Dashboard {
    devices: DashboardDeviceDefinition[];
}

@Injectable({
                providedIn: "root"
            })
export class DashboardService {
    public dashboard: Dashboard;


    public combined: any;
    private _ready: boolean;
    private _userDashboard: UserDashboard;
    private _groupDashboard: GroupDashboard;
    private _readyPromise: Promise<boolean> = new Promise<boolean>((resolve) => {
        const loop = () => {
            if (this._ready) {
                resolve(true);
            } else {
                log.verbose("Waiting for ready.");
                setTimeout(loop, 100);
            }
        };
        setTimeout(loop, 50);
    });

    constructor(private _notify: NotificationService, private _prefs: PreferenceService) {
        this.combined = {...environment};
    }

    private _groups: string[] = [];

    public get groups(): string[] {
        return this._groups;
    }


    public async init() {
        const groups = (await Auth.currentAuthenticatedUser()).signInUserSession.accessToken.payload["cognito:groups"];
        const username = await this._prefs.username;
        if (!groups || groups.length === 1) {
            this._groups = groups;
        } else {
            log.error("User is a member of more than one group (not supported)");
        }
        log.debug("** Dashboard Service Initializing **");
        if (!groups || groups.length === 0) {
            this._notify.show(
                // tslint:disable-next-line:max-line-length
                "Your account is not a member of a group, please ask an administrator to fix this. The application will not work correctly until you do.",
                "I Will",
                180);
            this._groups = ["__invalid__"];
            return;
        } else {
            const groupDash = await DataStore.query(GroupDashboard, q => q.group("eq", this._groups[0]));
            if (groupDash.length === 0) {
                log.debug("No existing dashboards.");

                log.debug("Created new group dashboards.");
                await this._prefs.waitUntilReady();
                this._groupDashboard = await DataStore.save(
                    new GroupDashboard({
                                           group:     this._groups[0],
                                           dashboard: JSON.stringify(this._prefs.combined.defaultDashboard)
                                       }));
            } else {
                log.debug("Existing group dashboards.");
                this._groupDashboard = groupDash[0];

            }
        }

        try {
            log.debug("Making sure storage is ready.");
            const dashboard = await DataStore.query(UserDashboard, q => q.owner("eq", username));
            if (dashboard.length === 0) {
                log.debug("No existing user dashboards.");

                log.info("Creating dashboard from group default dashboard.");
                this._userDashboard = await DataStore.save(
                    new UserDashboard({owner: username, dashboard: this._groupDashboard.dashboard}));

                log.debug("Created new dashboard.");
            } else {
                log.debug("Existing dashboard", dashboard);
                this._userDashboard = dashboard[0];

            }
            this.dashboard = JSON.parse(this._userDashboard.dashboard);
            this._ready = true;

        } catch (e) {
            log.error(e);

        }
        log.info("Dashboard Service Initialized");


    }

    public async persist() {
        const username = await this._prefs.username;

        const userDash = await DataStore.query(UserDashboard, q => q.owner("eq", username));
        if (userDash.length !== 1) {
            console.log("Number of dashboards for user was " + userDash.length);
        }
        const saved = DataStore.save(UserDashboard.copyOf(userDash[0], m => {
            m.dashboard = JSON.stringify(this.dashboard);
        }));
        this._userDashboard = await saved;
    }


    public async waitUntilReady() {
        return this._readyPromise;
    }


    public async reset() {
        this.dashboard = JSON.parse(this._groupDashboard.dashboard);
        await this.persist();
    }

    public async addGraph(type: string, title: string, cols: number, rows: number, state: any,
                          variant?: string) {
        this.dashboard.devices[0].pages[0].cards.push({
                                                          title,
                                                          cols,
                                                          rows,
                                                          type,
                                                          state,
                                                          variant
                                                      });
        await this.persist();
    }
}
