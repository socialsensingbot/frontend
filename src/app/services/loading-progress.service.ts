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
    private _progressPercentage = 0;

    public get progressPercentage(): number {
        return this._progressPercentage;
    }

    public set progressPercentage(value: number) {
        this._progressPercentage = value;
    }


    constructor() {
    }

    public progress(message: string, stage: number = -1) {
        this.spinnerMode = "determinate";
        if (!this.loadingComplete && stage > 0 && stage > this.currentStage) {
            this.currentStage = stage;
            this.showSpinner = true;
            this._progressPercentage = this.currentStage / this.maxStages;
        }
        log.info(message);
    }

    public showDeterminateSpinner(message: string, percentage: number) {
        this.spinnerMode = "determinate";
        this.showSpinner = true;
        this._progressPercentage = percentage;
        log.info(message + " " + percentage * 100 + "%");

    }

    public loaded(): void {
        log.info("Finished loading");
        this.currentStage = 0;
        this.loadingComplete = true;
        this.showSpinner = false;
        this._progressPercentage = 100;
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

    public hideSpinner() {
        this.showSpinner = false;
    }
}
