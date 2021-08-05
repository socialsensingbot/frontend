import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from "@angular/core";
import {ChangeContext, LabelType, Options} from "ng5-slider";
import {Subscription, timer} from "rxjs";
import {Logger} from "@aws-amplify/core";
import {environment} from "../../../environments/environment";
import {PreferenceService} from "../../pref/preference.service";

const log = new Logger("date-range");

@Component({
               selector:    "date-range-slider",
               templateUrl: "./date-range-slider.component.html",
               styleUrls:   ["./date-range-slider.component.scss"]
           })

/**
 * This component provides a date range slider which periodically emits change
 * events.
 */
export class DateRangeSliderComponent implements OnInit, OnDestroy {


    @Output()
    public onEnd = new EventEmitter<DateRange>();


    /**
     * This is the output of the component and will emit date ranges
     * when the the slider value changes. Changes are throttled by {@link _emitTimer}.
     */
    @Output() dateRange = new EventEmitter<DateRange>();
    /** Used to trigger manual refresh of the labels */
    public refresh: EventEmitter<void> = new EventEmitter<void>();
    /**
     * These are the options for the ng5-slider
     *
     * @see https://angular-slider.github.io/ng5-slider
     */
    public sliderOptions: Options = {
        floor:      0,
        ceil:       0,
        showTicks:  false,
        ticksArray: [],
        stepsArray: [],
        // handleDimension: 12,
        inputEventsInterval:  100,
        mouseEventsInterval:  100,
        outputEventsInterval: 100,
        touchEventsInterval:  100,
        ticksTooltip:         (value: number): string => {
            if (value === 0) {
                return "now";
            }
            return this.cleanDate(value, 0, "");
        },
        translate:            (value: number, label: LabelType): string => {

            if (value === 0 && this._pref.combined.mostRecentDateIsNow) {
                return `<span class="slider-date-time slider-date-time-max"><span class='slider-time'></span> <span class='slider-date'>now</span></span>`;

            }
            switch (label) {
                case LabelType.Low:
                    return this.cleanDate(value, 0, "min");
                case LabelType.High:
                    return this.cleanDate(value, 1, "max");
                default:
                    return this.cleanDate(value, 0, "");
            }

        }
    };
    private cache: any = {};
    private updateTimerSub: Subscription;

    constructor(private _pref: PreferenceService) {
    }

    private _lowerValue = -1;

    public get lowerValue(): number {
        return this._lowerValue;
    }

    /**
     * This is called when the user slides the lower range on the slider.
     *
     * @param value the offset in minutes (a negative number)
     */
    public set lowerValue(value: number) {
        log.debug("Lower value changed to " + value);

        if (typeof value === "undefined") {
            log.debug("Undefined lower value");
        }
        this._lowerValue = value;
        this.ready = true;
    }

    private _upperValue = 0;

    public get upperValue(): number {
        return this._upperValue;
    }

    /**
     * This is called when the user slides the upper range on the slider.
     *
     * @param value the offset in minutes (a negative number)
     */
    public set upperValue(value: number) {
        log.debug("Upper value changed to " + value);
        if (typeof value === "undefined") {
            log.debug("Undefined upper value");
        }
        this._upperValue = value;

    }

    /**
     * These are the options for *this* component, not the ng5-slider.
     */
    private _options: DateRangeSliderOptions;
    public ready = false;

    /**
     * These are the options for *this* component, not the ng5-slider.
     *
     * The ng5-slider is configured through {@link this.sliderOptions}
     */
    @Input()
    public set options(value: DateRangeSliderOptions) {
        this._options = value;
        this._lowerValue = value.startMin;
        this._upperValue = value.startMax;
        this.sliderOptions = {...this.sliderOptions, ceil: value.max, floor: value.min};
        this.updateTicks();
    }

    ngOnInit() {
        this.updateTimerSub = timer(0, 60 * 1000).subscribe(i => {
                                                                log.debug("Received new time-keyed data");
                                                                this.updateTicks();
                                                                this.refresh.emit();
                                                            }
        );
    }

    ngOnDestroy() {
        this.updateTimerSub.unsubscribe();
    }

    cleanDate(value, add, label): string {
        const date = new Date(value);
        const ye = new Intl.DateTimeFormat(environment.locale,
                                           {year: "2-digit", timeZone: environment.timezone}).format(
            date);
        const mo = new Intl.DateTimeFormat(environment.locale,
                                           {month: "short", timeZone: environment.timezone}).format(
            date);
        const da = new Intl.DateTimeFormat(environment.locale,
                                           {day: "2-digit", timeZone: environment.timezone}).format(
            date);
        const hr = new Intl.DateTimeFormat(environment.locale,
                                           {hour: "2-digit", hour12: true, timeZone: environment.timezone}).format(
            date);

        return `<span class="slider-date-time slider-date-time-${label}"><span class='slider-time'>${hr}</span> <span class='slider-date'>${da}-${mo}-${ye}</span></span>`;

    }

    public changeEvent($event: ChangeContext) {
        this.dateRange.emit(new DateRange(this._lowerValue, this._upperValue));
    }

    public onEndEvent($event: ChangeContext) {
        this.onEnd.emit(new DateRange(this._lowerValue, this._upperValue));
    }

    private updateTicks() {

        this.sliderOptions.stepsArray = [];
        for (let step = this.sliderOptions.floor;
             step < this.sliderOptions.ceil;
             step = step + 60) {
            this.sliderOptions.stepsArray.push({value: step});
        }
        if (this.sliderOptions.stepsArray[this.sliderOptions.stepsArray.length - 1].value !== this.sliderOptions.ceil) {
            this.sliderOptions.stepsArray.push({value: this.sliderOptions.ceil});
        }

    }
}

export class DateRangeSliderOptions {
    min: number;
    max: number;
    startMin: number;
    startMax: number;
}

export class DateRange {
    constructor(public lower: number, public upper: number) {

    }

}
