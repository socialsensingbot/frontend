import {Component, Input, OnInit} from '@angular/core';
import {ColorCodeService} from "../services/color-code.service";
import {PreferenceService} from "../../pref/preference.service";

@Component({
               selector:    'map-legend',
               templateUrl: './legend.component.html',
               styleUrls:   ['./legend.component.scss']
           })
export class LegendComponent implements OnInit {
    public activeLayerGroupTitle: any;
    public getColor: (number) => string = null;
    public values: number[] = [];
    private colors: any[];

    public _activeLayerGroup: string;

    @Input()
    public set activeLayerGroup(value: string) {
        this._activeLayerGroup = value;
        this.activeLayerGroupTitle = this._pref.enabledLayers.filter(i => i.id === value)[0].title;
    }

    private _activeNumber: string = "stats";

    public get activeNumber() {
        return this._activeNumber;
    }

    @Input()
    public set activeNumber(value: string) {
        this._activeNumber = value;
        ({values: this.values, colors: this.colors} = (this._color.colorData)[(this._activeNumber)]);
        this.getColor = (this._color.colorFunctions)[(this._activeNumber)].getColor;
    }

    constructor(private _color: ColorCodeService, private _pref: PreferenceService) {

    }

    ngOnInit() {
    }

    public iconStyle(i: number) {
        return "background:red";
        // return 'background:'+this.getColor(this.values[i]);
    }
}
