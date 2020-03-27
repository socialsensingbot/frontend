import {Component, Input, OnInit} from '@angular/core';
import {ControlOptions, DomUtil} from "leaflet";
import {MapComponent} from "../map/map.component";

@Component({
             selector:    'map-legend',
             templateUrl: './legend.component.html',
             styleUrls:   ['./legend.component.scss']
           })
export class LegendComponent implements OnInit {
  public getColor: (number) => string;
  public values: number[];
  private colors: any[];

  @Input()
  public set activeNumber(value: any) {
    this._activeNumber = value;
    if(this._colorData) {
      this.values = (this._colorData)[(this._activeNumber)].values;
      this.colors = (this._colorData)[(this._activeNumber)].colors;
    }
    if(this._colorFunctions) {
      this.getColor = (this._colorFunctions)[(this._activeNumber)].getColor;
    }
  }

  @Input()
  public set colorFunctions(value: () => []) {
    this._colorFunctions = value;
    if(typeof this._activeNumber === "number") {
      this.getColor = (this._colorFunctions)[(this._activeNumber)].getColor;
    }
  }

  @Input()
  public set colorData(value: any) {
    this._colorData = value;
    if(typeof this._activeNumber === "number") {
      this.values = (this._colorData)[(this._activeNumber)].values;
      this.colors = (this._colorData)[(this._activeNumber)].colors;
    }
  }

  private _colorData: any;
  private _activeNumber: any;
  private _colorFunctions: () => [];

  constructor() { }

  ngOnInit() {
  }

  public iconStyle(i: number) {
    return "background:red";
    // return 'background:'+this.getColor(this.values[i]);
  }
}
