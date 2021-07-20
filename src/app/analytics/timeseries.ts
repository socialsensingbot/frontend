import {EventEmitter} from "@angular/core";
import {Logger} from "@aws-amplify/core";
import {v4 as uuidv4} from "uuid";

const log = new Logger("timeseries");

export class TimeseriesModel {

    constructor(public label: string, public data: any[], public id = uuidv4()) {
    }
}

export class TimeseriesCollectionModel {

    public seriesAdded: EventEmitter<TimeseriesModel> = new EventEmitter<TimeseriesModel>();
    public seriesRemoved: EventEmitter<string> = new EventEmitter<string>();
    public seriesUpdated: EventEmitter<TimeseriesModel> = new EventEmitter<TimeseriesModel>();
    public yAxisChanged: EventEmitter<void> = new EventEmitter<void>();
    private map: Map<string, TimeseriesModel> = new Map<string, TimeseriesModel>();
    private _minDate: Date = null;
    private _maxDate: Date = null;

    constructor(public xField = "date",
                public yField = "Count",
                public yLabel: string = "count",
                public xLabel: string = "Date",
                public rollingAvg: boolean = false,
                public avgLength = 14,
                public zeroFillMissingDates = true,
                public dateSpacing = 24 * 60 * 60 * 1000) {


    }


    public addTimeseries(series: TimeseriesModel) {
        this.seriesAdded.emit(this._addSeries(series));
    }

    public removeTimeseries(series: TimeseriesModel) {
        this.map.delete(series.id);
        this.seriesRemoved.emit(series.id);
    }

    public zeroFill(mappedData: any[]) {
        if (this.zeroFillMissingDates) {
            const result = [];
            let lastRowDate = null;
            for (const row of mappedData) {
                const rowDate = Math.round(new Date(row[this.xField]).getTime() / this.dateSpacing) * this.dateSpacing;
                if (lastRowDate !== null) {
                    if (rowDate > lastRowDate + this.dateSpacing) {
                        for (let fillDate = lastRowDate + this.dateSpacing; fillDate < rowDate; fillDate += this.dateSpacing) {
                            const fillRow = {};
                            fillRow[this.xField] = new Date(fillDate);
                            fillRow[this.yField] = 0;
                            result.push(fillRow);
                        }
                    }
                }
                result.push(row);
                lastRowDate = rowDate;
            }
            log.debug("Before ZERO FILL ", mappedData);
            log.debug("After ZERO FILL ", result);
            return result;
        } else {
            return mappedData;
        }

    }

    public foreachSeries(fn: (label, data, id?) => void) {
        this.map.forEach(value => {fn(value.label, value.data, value.id);});
    }

    public hasSeriesWithUUID(uuid: string) {
        return this.map.has(uuid);
    }

    public updateTimeseries(timeseriesModel: TimeseriesModel) {
        this.map.delete(timeseriesModel.id);
        this.seriesUpdated.emit(this._addSeries(timeseriesModel));
    }

    private _addSeries(series: TimeseriesModel) {
        const data = this.zeroFill(series.data);
        for (const item of data) {
            const date = new Date(item[this.xField]);
            log.debug(date);
            if (this._minDate === null || date.getTime() < this._minDate.getTime()) {
                this._minDate = date;
            }
            if (this._maxDate === null || date.getTime() > this._maxDate.getTime()) {
                this._maxDate = date;
            }
        }
        log.debug("MIN_DATE", this._minDate);
        log.debug("MAX_DATE", this._maxDate);
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

    public yAxisHasChanged() {
        this.yAxisChanged.emit();
    }
}
