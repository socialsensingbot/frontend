import {Component, Input, OnInit} from '@angular/core';
import {ColorCodeService} from "../services/color-code.service";

@Component({
             selector:    'map-legend',
             templateUrl: './legend.component.html',
             styleUrls:   ['./legend.component.scss']
           })
export class LegendComponent implements OnInit {
  public getColor: (number) => string = null;
  public values: number[] = [];
  private colors: any[];

  @Input()
  public set activeNumber(value: string) {
    this._activeNumber = value;
    ({values: this.values, colors: this.colors} = (this._color.colorData)[(this._activeNumber)]);
    this.getColor = (this._color.colorFunctions)[(this._activeNumber)].getColor;
  }

  public get activeNumber() {
    return this._activeNumber;
  }


  private _activeNumber: string = "stats";

  constructor(private _color: ColorCodeService) {

  }

  ngOnInit() {
  }

  public iconStyle(i: number) {
    return "background:red";
    // return 'background:'+this.getColor(this.values[i]);
  }
}
