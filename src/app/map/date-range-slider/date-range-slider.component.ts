import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {LabelType, Options} from "ng5-slider";
import {Subscription, timer} from "rxjs";
import {Hub, Logger} from "aws-amplify";
import {NgEventBus} from "ng-event-bus";
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
  public get timeKeyedData(): any {
    return this._timeKeyedData;
  }

  @Input()
  public set timeKeyedData(value: any) {
    log.debug("Received new time-keyed data")
    this._timeKeyedData = value;
    this.refresh.emit();
  }


  @Output() public onEnd= new EventEmitter<any>()

  /**
   * Time series data, keyed by one minute interval.
   */
  private _timeKeyedData: any;

  /**
   * These are the options for *this* component, not the ng5-slider.
   *
   * The ng5-slider is configured through {@link this.sliderOptions}
   */
  @Input()
  public set options(value: DateRangeSliderOptions) {
    this._options = value;
    this.sliderOptions.ceil = value.max;
    this.sliderOptions.floor = value.min;
    this._lowerValue = value.startMin;
    this._upperValue = value.startMax;

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
    log.debug("Upper value changed to "+value);
    if (typeof value === "undefined") {
      log.debug("Undefined upper value");
    }
    this._upperValue = value;
    if (typeof this._timeKeyedData !== "undefined") {
      log.debug(value);
      this.dateRange.emit(new DateRange(this._lowerValue, this._upperValue));    }
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
    log.debug("Lower value changed to "+value);

    if (typeof value === "undefined") {
      log.debug("Undefined lower value");
    }
    this._lowerValue = value;
    if (typeof this._timeKeyedData !== "undefined") {
      log.debug(value);
      this.dateRange.emit(new DateRange(this._lowerValue, this._upperValue));
    }
  }

  /**
   * This is the output of the component and will emit date ranges
   * when the the slider value changes. Changes are throttled by {@link _emitTimer}.
   */
  @Output() dateRange = new EventEmitter<DateRange>();

  private _lowerValue: number = -1;

  private _upperValue: number = 0;

  /** Used to trigger manual refresh of the labels */
  public   refresh: EventEmitter<void> = new EventEmitter<void>();

  /**
   * These are the options for the ng5-slider
   *
   * @see https://angular-slider.github.io/ng5-slider
   */
  public sliderOptions: Options = {
    floor:        0,
    ceil:         0,
    step:         60,
    showTicks:    false,
    ticksTooltip: (value: number): string => {
      return this._timeKeyedData[-value] ? this.cleanDate(this._timeKeyedData[-value], 0,"") : ""
    },
    translate:    (value: number, label: LabelType): string => {
      if (typeof this._timeKeyedData !== "undefined" && typeof this._timeKeyedData[-value] !== "undefined") {
        switch (label) {
          case LabelType.Low:
            return this._timeKeyedData[-value] ? this.cleanDate(this._timeKeyedData[-value], 0,"min") : "";
          case LabelType.High:
            return this._timeKeyedData[-value] ? this.cleanDate(this._timeKeyedData[-value], 1,"max") : "";
          default:
            return this._timeKeyedData[-value] ? this.cleanDate(this._timeKeyedData[-value], 0,"") : "";
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

  constructor() {

  }

  ngOnInit() {

  }

  ngOnDestroy() {
  }


  cleanDate(tstring, add,label): string {
    const date = new Date(tstring.substring(0, 4), tstring.substring(4, 6) - 1, tstring.substring(6, 8),
                          tstring.substring(8, 10), +tstring.substring(10, 12) + add, 0, 0);
    const ye = new Intl.DateTimeFormat('en', {year: '2-digit'}).format(date);
    const mo = new Intl.DateTimeFormat('en', {month: 'short'}).format(date);
    const da = new Intl.DateTimeFormat('en', {day: '2-digit'}).format(date);
    const hr = new Intl.DateTimeFormat('en', {hour: '2-digit', hour12:true}).format(date);

    return `<span class="slider-date-time slider-date-time-${label}"><span class='slider-time'>${hr}</span> <span class='slider-date'>${da}-${mo}-${ye}</span></span>`;
    //var date = new Date( tstring.substring(0,4), tstring.substring(4,6)-1, tstring.substring(6,8), +tstring.substring(8,10)+add, 0, 0, 0);

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
