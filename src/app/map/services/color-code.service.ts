import { Injectable } from '@angular/core';
import {getColor, getFeatureStyle} from "./layer-style.service";
import {ColorData, ColorFunctions, numberLayerShortNames} from "../types";

@Injectable({
  providedIn: 'root'
})
export class ColorCodeService {

  public colorData: ColorData = {
    stats: {values: [5, 2.5, 1, 0.5], colors: ['#FEE5D9', '#FCAE91', '#FB6A4A', '#DE2D26', '#A50F15']},
    count: {values: [150, 50, 20, 10], colors: ['#045A8D', '#2B8CBE', '#74A9CF', '#BDC9E1', '#F1EEF6']}
  };

  public colorFunctions: ColorFunctions = {stats: null, count: null};

  constructor() {
    // Set up the color functions for the legend
    const newColorFunctions: ColorFunctions = {stats: null, count: null};
    for (let key of numberLayerShortNames) {
      newColorFunctions[key] = {
        getColor:        getColor.bind(newColorFunctions[key], this.colorData[key].values,
                                       this.colorData[key].colors),
        getFeatureStyle: getFeatureStyle.bind(newColorFunctions[key], this.colorData[key].values,
                                              this.colorData[key].colors,
                                              key)
      };
    }
    //This assignment triggers the change to the legend
    this.colorFunctions = newColorFunctions;

  }
}
