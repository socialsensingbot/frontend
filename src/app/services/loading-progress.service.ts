import {Injectable} from "@angular/core";
import {Logger} from "@aws-amplify/core";
import {ProgressSpinnerMode} from "@angular/material/progress-spinner";

const log = new Logger("loading");

@Injectable({
                providedIn: "root"
            })
export class LoadingProgressService {

    private maxStages = 8;
    private currentStage = 0;
    private loadingComplete = false;
    public showSpinner = false;
    public spinnerMode: ProgressSpinnerMode = "determinate";

    public get progressPercentage(): number {
        return this.currentStage / this.maxStages;
    }


    constructor() {
    }

    public progress(message: string, stage: number = -1) {
        if (!this.loadingComplete && stage > 0 && stage > this.currentStage) {
            this.currentStage = stage;
            this.showSpinner = true;
        }
        log.info(message);
    }

    public loaded(): void {
        log.info("Finished loading");
        this.currentStage = 0;
        this.loadingComplete = true;
        this.showSpinner = false;
        $("#loading-div").css("opacity", 0.0);
        setTimeout(() => $("#loading-div").remove(), 1000);
    }

    public showIndeterminateSpinner() {
        this.showSpinner = true;
        this.spinnerMode = "indeterminate";
    }

    public hideIndeterminateSpinner() {
        this.showSpinner = false;
        this.spinnerMode = "determinate";
    }
}
