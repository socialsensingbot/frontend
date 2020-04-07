import {Component, Input, OnInit} from '@angular/core';

@Component({
             selector:    'map-legend',
             templateUrl: './legend.component.html',
             styleUrls:   ['./legend.component.scss']
           })
export class LegendComponent implements OnInit {
  public getColor: (number) => string= null;
  public values: number[]=[];
  private colors: any[];

  @Input()
  public set activeNumber(value: string) {
    this._activeNumber = value;
    if(this._colorData) {
      ({values: this.values, colors: this.colors} = (this._colorData)[(this._activeNumber)]);
    }
    if(this._colorFunctions) {
      this.getColor = (this._colorFunctions)[(this._activeNumber)].getColor;
    }
  }

  @Input()
  public set colorFunctions(value: { stats:(()=>any)[], count:(()=>any)[]}) {
    this._colorFunctions = value;
    if(typeof this._activeNumber !== "undefined" && (this._colorFunctions)[(this._activeNumber)] !=null) {
      this.getColor = (this._colorFunctions)[(this._activeNumber)].getColor;
    }
  }

  @Input()
  public set colorData(value: any) {
    this._colorData = value;
    if(typeof this._activeNumber !== "undefined") {
      ({values: this.values, colors: this.colors} = (this._colorData)[(this._activeNumber)]);
    }
  }

  private _colorData: any;
  private _activeNumber: string="stats";
  private _colorFunctions: { stats: (() => any)[]; count: (() => any)[] };

  constructor() { }

  ngOnInit() {
  }

  public iconStyle(i: number) {
    return "background:red";
    // return 'background:'+this.getColor(this.values[i]);
  }
}
