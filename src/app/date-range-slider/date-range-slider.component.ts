import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {LabelType, Options} from "ng5-slider";
import {timer} from "rxjs";

@Component({
             selector:    'date-range-slider',
             templateUrl: './date-range-slider.component.html',
             styleUrls:   ['./date-range-slider.component.scss']
           })


export class DateRangeSliderComponent implements OnInit,OnDestroy {

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


  public set upperValue(value: number) {
    this._upperValue = value;
    if (typeof this.timeKeys !== "undefined") {
      console.log(value);
      this.dateRange.emit(new DateRange(this._lowerValue, this._upperValue));
    }
  }

  public get lowerValue(): number {
    return this._lowerValue;
  }


  public set lowerValue(value: number) {
    this._lowerValue = value;
    if (typeof this.timeKeys !== "undefined") {
      console.log(value);
      this.dateRange.emit(new DateRange(this._lowerValue, this._upperValue));
    }
  }

  @Output() dateRange = new EventEmitter<DateRange>();

  private _lowerValue: number = -1;

  private _upperValue: number = 0;


  public sliderOptions: Options = {
    floor:     0,
    ceil:      0,
    step:      24*60,
    showTicks: true,
    translate: (value: number, label: LabelType): string => {
      if (typeof this.timeKeys !== "undefined" && typeof this.timeKeys[-value] !== "undefined") {
        switch (label) {
          case LabelType.Low:
            return this.timeKeys[-value] ? this.cleanDate(this.timeKeys[-value], 0).toDateString() : "";
          case LabelType.High:
            return this.timeKeys[-value] ? this.cleanDate(this.timeKeys[-value], 1).toDateString(): "";
          default:
            return this.timeKeys[-value] ?  this.cleanDate(this.timeKeys[-value], 0).toDateString(): "";
        }
      }
    }
  };

  @Input() public timeKeys: any;
  private _options: DateRangeSliderOptions;

  constructor() {

  }

  ngOnInit() {

  }

  ngOnDestroy() {

  }


  cleanDate(tstring, add): Date {
    return new Date(tstring.substring(0, 4), tstring.substring(4, 6) - 1, tstring.substring(6, 8),
                    tstring.substring(8, 10), +tstring.substring(10, 12) + add, 0, 0);
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
