import {EventEmitter} from "@angular/core";
import {Logger} from "@aws-amplify/core";
import {v4 as uuidv4} from "uuid";
import {dayInMillis} from "../common";
import {SSMapLayer} from "../types";

const log = new Logger("timeseries");

export const timeSeriesAutocompleteType = "graph-text-search";

export type  StatisticType = "count" | "exceedance";

export type TimePeriod = "hour" | "day";

export interface TimeseriesAnalyticsComponentState {
    title?: string;
    dateSpacing?: number;
    avgLength?: number;
    rollingAverage?: boolean;
    eoc: StatisticType;
    lob: "line" | "bar";
    queries: TimeseriesRESTQuery[];
    timePeriod: TimePeriod;
    from?: number;
    to?: number;

}


export interface TimeseriesRESTQuery {
    dateStep?: number;
    to?: number;
    from?: number;
    location?: string;
    regions: string[];
    textSearch?: string;
    __series_id?: string;
    layer?: SSMapLayer
}


export class TimeseriesModel {

    constructor(public label: string, public data: any[], public id = uuidv4()) {
    }
}

export type GraphType = "line" | "bar";

export class TimeseriesCollectionModel {
    public seriesAdded: EventEmitter<TimeseriesModel> = new EventEmitter<TimeseriesModel>();
    public seriesRemoved: EventEmitter<string> = new EventEmitter<string>();
    public seriesUpdated: EventEmitter<TimeseriesModel> = new EventEmitter<TimeseriesModel>();
    public yAxisChanged: EventEmitter<void> = new EventEmitter<void>();
    public graphTypeChanged: EventEmitter<GraphType> = new EventEmitter<GraphType>();
    public cleared: EventEmitter<void> = new EventEmitter<void>();
    private map: Map<string, TimeseriesModel> = new Map<string, TimeseriesModel>();
    private _minDate: Date = null;
    private _maxDate: Date = null;
    public minScrollbarDate: Date = null;
    public maxScrollbarDate: Date = null;
    public rangeChanged: EventEmitter<void> = new EventEmitter<void>();


    public get minDate(): Date {
        return this._minDate;
    }

    public set minDate(value: Date) {
        log.debug("Min date: " + value)
        this._minDate = value;
    }

    public get maxDate(): Date {
        return this._maxDate;
    }

    public set maxDate(value: Date) {
        log.debug("Max date: " + value)
        this._maxDate = value;
    }

    public get graphType(): GraphType {
        return this._graphType;
    }

    public set graphType(value: "bar" | "line") {
        this._graphType = value;
        this.graphTypeChanged.emit(value);
    }

    public get size(): number {
        return this.map.size;
    }

    get dateSpacing(): number {
        return this._dateSpacing;
    }

    set dateSpacing(value: number) {
        this._dateSpacing = value;
    }

    constructor(public xField = "date",
                public yField = "Count",
                public yLabel: string = "count",
                public xLabel: string = "Date",
                public rollingAvg: boolean = false,
                public avgLength = 14,
                public zeroFillMissingDates = true,
                private _dateSpacing = dayInMillis,
                private _graphType: GraphType = "line") {
        this.minDate = new Date();
        this.maxDate = new Date();
    }

    public addTimeseries(series: TimeseriesModel) {
        this.seriesAdded.emit(this._addSeries(series));
    }

    public removeTimeseries(id: string) {
        this.map.delete(id);
        this.seriesRemoved.emit(id);
    }

    public zeroFill(mappedData: any[]) {
        for (const item of mappedData) {
            const date = new Date(item[this.xField]);
            if (this._minDate === null || date.getTime() < this._minDate.getTime()) {
                log.verbose("Updating minDate from " + this._maxDate + " to " + date);
                this._minDate = date;
            }
            if (this._maxDate === null || date.getTime() > this._maxDate.getTime()) {
                log.verbose("Updating maxDate from " + this._maxDate + " to " + date);
                this._maxDate = date;
            }
        }
        log.debug("MIN_DATE", this._minDate);
        log.debug("MAX_DATE", this._maxDate);

        if (this.zeroFillMissingDates) {
            const result = new Map();
            for (let timestamp = this.roundDate(
                this._minDate.getTime()); timestamp <= this._maxDate.getTime(); timestamp += this._dateSpacing) {
                const fillRow = {};
                fillRow[this.xField] = new Date(new Date(timestamp));
                fillRow[this.yField] = 0;
                result.set(timestamp, fillRow);
            }
            for (const row of mappedData) {
                const rowDate = this.roundDate(new Date(row[this.xField]).getTime());
                result.set(rowDate, row);
            }
            const newMappedData = [];
            for (const resultElement of result.values()) {
                newMappedData.push(resultElement);
            }
            log.debug("Before ZERO FILL ", mappedData);
            log.debug("After ZERO FILL ", newMappedData);
            return newMappedData.sort((a, b) => a[this.xField] - b[this.xField]);
        } else {
            return mappedData;
        }

    }

    private roundDate(val): number {
        return Math.round(val / this._dateSpacing) * this._dateSpacing;
    }

    public foreachSeries(fn: (label, data, id?) => void) {
        this.map.forEach(value => {
            fn(value.label, value.data, value.id);
        });
    }

    public hasSeriesWithUUID(uuid: string) {
        return this.map.has(uuid);
    }

    public updateTimeseries(timeseriesModel: TimeseriesModel) {
        log.debug("updateTimeseries() called");
        this.map.delete(timeseriesModel.id);
        this.seriesUpdated.emit(this._addSeries(timeseriesModel));
        log.debug("updateTimeseries() finished");
    }

    public yAxisHasChanged() {
        this.yAxisChanged.emit();
    }


    public clear() {
        this.map.clear();
        this.cleared.emit();
    }

    public maximumDate(): void {

    }

    public minimumDate(): any {

    }

    private _addSeries(series: TimeseriesModel) {
        const data = this.zeroFill(series.data);
        let count = 0;
        for (const item of data) {
            if (this.rollingAvg || count % this.avgLength === 0) {
                if (count >= this.avgLength) {
                    const slice = data.slice(count - this.avgLength, count - 1);
                    item.trend = slice.map(i => i[this.yField])
                                      .reduce((p, c) => p + c, 0) / this.avgLength;
                }
            }
            count++;
        }
        const result = new TimeseriesModel(series.label, data, series.id);
        this.map.set(series.id, result);
        return result;
    }
}
