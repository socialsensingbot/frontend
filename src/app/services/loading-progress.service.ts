import {Injectable} from "@angular/core";
import {Logger} from "@aws-amplify/core";

const log = new Logger("loading");
@Injectable({
                providedIn: "root"
            })
export class LoadingProgressService {

    private maxStages = 8;
    private currentStage = 0;

    public get progressPercentage(): number {
        return this.currentStage / this.maxStages;
    }


    constructor() {
    }

    public progress(message: string, stage: number = -1) {
        if (stage > 0) {
            this.currentStage = stage;
        }
        log.info(message);
    }

    public loaded(): void {
        log.info("Finished loading");
        this.currentStage = 0;
        $("#loading-div").css("opacity", 0.0);
        setTimeout(() => $("#loading-div").remove(), 1000);
    }
}
