import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayerStyleService {

  constructor() { }
}

export function getColor(values, colors, d){
  if(d == 0) {
    return "#000000"
  }
  for(var i=0; i<values.length; i++){
    if(d > values[i]){ return colors[i]; }
  }
  return colors[ colors.length - 1 ];
}

export function getFill(d) {
  return (d == 0)  ? 0.1 : 0.7;
}

export function getFeatureStyle(values, colors, layer_type, feature){
  if( feature ){
    var d = (feature.properties[layer_type]) ? feature.properties[layer_type] : 0;
    return {
      fillColor:   getColor(values, colors, d),
      weight:      1,
      opacity:     0.5,
      color:       'white',
      dashArray:   '',
      fillOpacity: getFill(d),
      className:   ("x-feature-name-" + feature.properties.name).replace(/ +/g, "-")
    };
  }
}



