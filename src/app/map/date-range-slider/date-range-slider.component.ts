import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ChangeContext, LabelType, Options} from "ng5-slider";
import {Subscription, timer} from "rxjs";
import {Cache, Hub, Logger} from "aws-amplify";
import {NgEventBus} from "ng-event-bus";
import {MapDataService} from "../data/map-data.service";
import {environment} from "../../../environments/environment";

const log = new Logger('date-range');

@Component({
             selector:    'date-range-slider',
             templateUrl: './date-range-slider.component.html',
             styleUrls:   ['./date-range-slider.component.scss']
           })

/**
 * This component provides a date range slider which periodically emits change
 * events.
 */
export class DateRangeSliderComponent implements OnInit, OnDestroy {


  @Output() public onEnd = new EventEmitter<any>()

  /**
   * Time series data, keyed by one minute interval.
   */
  public timeKeyedData: any;
  private cache: any = {};

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
  }


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
  }

  /**
   * This is the output of the component and will emit date ranges
   * when the the slider value changes. Changes are throttled by {@link _emitTimer}.
   */
  @Output() dateRange = new EventEmitter<DateRange>();

  private _lowerValue: number = -1;

  private _upperValue: number = 0;

  /** Used to trigger manual refresh of the labels */
  public refresh: EventEmitter<void> = new EventEmitter<void>();

  /**
   * These are the options for the ng5-slider
   *
   * @see https://angular-slider.github.io/ng5-slider
   */
  public sliderOptions: Options = {
    floor:               0,
    ceil:                0,
    step:                60,
    showTicks:           false,
    // handleDimension: 12,
    inputEventsInterval: 500,
    mouseEventsInterval: 500,
    ticksTooltip:        (value: number): string => {
      return this.timeKeyedData[-value] ? this.cleanDate(this.timeKeyedData[-value], 0, "") : ""
    },
    translate:           (value: number, label: LabelType): string => {
      if (typeof this.timeKeyedData !== "undefined" && typeof this.timeKeyedData[-value] !== "undefined") {
        switch (label) {
          case LabelType.Low:
            return this.timeKeyedData[-value] ? this.cleanDate(this.timeKeyedData[-value], 0, "min") : "";
          case LabelType.High:
            return this.timeKeyedData[-value] ? this.cleanDate(this.timeKeyedData[-value], 1, "max") : "";
          default:
            return this.timeKeyedData[-value] ? this.cleanDate(this.timeKeyedData[-value], 0, "") : "";
        }
      } else {
        return "";
      }
    }
  };


  /**
   * These are the options for *this* component, not the ng5-slider.
   */
  private _options: DateRangeSliderOptions;

  constructor(private _data: MapDataService) {

  }

  private timeKeySub: Subscription;

  ngOnInit() {
    this.timeKeySub = this._data.timeKeyUpdate.subscribe(i => {
      log.debug("Received new time-keyed data")
      this.timeKeyedData = i;
      this.refresh.emit();
    });
  }

  ngOnDestroy() {
    this.timeKeySub.unsubscribe();
  }


  cleanDate(tstring, add, label): string {
    const key = ":clean-date:" + tstring + ":" + add + ":" + label;
    const cachedItem = this.cache[key];
    if (cachedItem != null) {
      return cachedItem;
    } else {
      const date = new Date(Date.UTC(tstring.substring(0, 4), tstring.substring(4, 6) - 1, tstring.substring(6, 8),
                                     tstring.substring(8, 10), +tstring.substring(10, 12) + add, 0, 0));
      const ye = new Intl.DateTimeFormat(environment.locale, {year: '2-digit', timeZone: environment.timezone}).format(
        date);
      const mo = new Intl.DateTimeFormat(environment.locale, {month: 'short', timeZone: environment.timezone}).format(
        date);
      const da = new Intl.DateTimeFormat(environment.locale, {day: '2-digit', timeZone: environment.timezone}).format(
        date);
      const hr = new Intl.DateTimeFormat(environment.locale,
                                         {hour: '2-digit', hour12: true, timeZone: environment.timezone}).format(date);

      const text = `<span class="slider-date-time slider-date-time-${label}"><span class='slider-time'>${hr}</span> <span class='slider-date'>${da}-${mo}-${ye}</span></span>`;
      //var date = new Date( tstring.substring(0,4), tstring.substring(4,6)-1, tstring.substring(6,8), +tstring.substring(8,10)+add, 0, 0, 0);
      this.cache[key] = text;
      return text;
    }

  }

  public change($event: ChangeContext) {
    if (typeof this.timeKeyedData !== "undefined") {
      log.debug($event);
      this.dateRange.emit(new DateRange(this._lowerValue, this._upperValue));
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
