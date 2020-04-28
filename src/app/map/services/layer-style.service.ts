import { Injectable } from '@angular/core';
import {Browser} from "leaflet";

@Injectable({
  providedIn: 'root'
})
export class LayerStyleService {

  constructor() { }
}

export function getColor(values, colors, d){
  for(var i=0; i<values.length; i++){
    if(d > values[i]){ return colors[i]; }
  }
  return colors[ colors.length - 1 ];
}

export function getFill(d) {
  return (d == 0)  ? 0 : 0.7;
}

export function getFeatureStyle(values, colors, layer_type, feature){
  if( feature ){
    var d = (feature.properties[layer_type]) ? feature.properties[layer_type] : 0;
    return {
      fillColor: getColor(values, colors, d),
      weight: 1,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: getFill(d)
    };
  }
}
