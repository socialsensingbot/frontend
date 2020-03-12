import {Component, OnInit} from '@angular/core';
import {Cache} from 'aws-amplify';
import {fgsData} from './county_bi';
import {coarseData} from './coarse_bi';
import {fineData} from './fine_bi';
import {getColor, getFill, getFeatureStyle, dohighlightFeature} from './layerStyle';
import {makeLegend} from './legend';
import {tinfo} from './tweetPanel';
import {fineBox} from './fineBox.js';
import {coarseBox} from './coarseBox.js';
import {processData, getTimes} from './processTweets';
import {timeslider, cleanDate} from './timeSlider';
import {Auth, Storage} from 'aws-amplify';
import {
  Map,
  DomUtil,
  latLng,
  layerGroup,
  tileLayer,
  control,
  point,
  GeoJSON,
  Control,
  ControlOptions,
  Browser
} from 'leaflet';
import * as $ from 'jquery';
import 'jquery-ui/ui/widgets/slider.js';
import {NavigationEnd, Router} from '@angular/router';


@Component({
             selector:    'app-map',
             templateUrl: './map.component.html',
             styleUrls:   ['./map.component.scss']
           })
export class MapComponent {
  private twitter: any;
  private tweetInfo: any = {};
  stats_layer = layerGroup();
  count_layer = layerGroup();
  layer_polys = {"county": fgsData, "fine": fineBox, "coarse": coarseBox};
  county_layer = layerGroup(); //dummy layers to fool layer control
  coarse_layer = layerGroup();
  fine_layer = layerGroup();

  options = {
    layers: [
      tileLayer(
        'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicnVkeWFydGh1ciIsImEiOiJjamZrem1ic3owY3k4MnhuYWt2dGxmZmk5In0.ddp6_hNhs_n9MJMrlBwTVg',
        {
          maxZoom:     18,
          attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
                         '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                         'Imagery © <a href="http://mapbox.com">Mapbox</a>',
          id:          'mapbox.streets'
        }),
      this.stats_layer,
      this.county_layer
    ],
    zoom:   6,
    center: latLng([53, -2])
  };

  stats = {"county": {}, "coarse": {}, "fine": {}};

  constructor(private _router: Router) {
  }

  onMapReady(map: Map) {
    // // @ts-ignore
    // map.fitBounds(this._router.getBounds(), {
    //   padding: point(24, 24),
    //   maxZoom: 12,
    //   animate: true
    // });

    this.load("county_stats.json", 60*60*24, json => this.stats.county = json)
        .then(()=>this.load("coarse_stats.json", 60*60*24, json => this.stats.coarse = json))
        .then(()=>this.load("fine_stats.json", 60*60*24, json => this.stats.fine = json))
        .then(() => this.main(map))
        .catch(err => console.log(err));
  }

  private load(key, expiresSeconds: number, action: (json) => void): Promise<any> {
    // if (Cache.getItem("json:" + key)) {
    //   return new Promise<any>(() => action(Cache.getItem("json:" + key)));
    // } else {
      return Storage.get(key)
                    .then((url: any) =>
                            fetch(url.toString())
                              .then(response => response.json())
                              .then(json => {
                                // Cache.setItem("json:" + key, json,{
                                //   expires: new Date().getTime()+(expiresSeconds * 1000)
                                // });
                                action(json);
                              }));
    // }
  }


  private main(map: Map) {


    //Generate Leaflet Map
    // var map = map('map',{
    //   center: [53, -2],
    //   zoom: 6
    // });

    //Add roads from mapbox
    // var streets = tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicnVkeWFydGh1ciIsImEiOiJjamZrem1ic3owY3k4MnhuYWt2dGxmZmk5In0.ddp6_hNhs_n9MJMrlBwTVg', {
    //   maxZoom: 18,
    //   attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    //              '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    //              'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    //   id: 'mapbox.streets'
    // }).addTo(map);

    //define the layers for the different counts
    var number_layers = {};
    number_layers["stats"] = layerGroup().addTo(map);
    number_layers["count"] = layerGroup();

    //layers for the different polygons
    var poly_layers = {};
    poly_layers["county"] = layerGroup().addTo(map); //This one is active
    poly_layers["coarse"] = layerGroup();
    poly_layers["fine"] = layerGroup();
    var basemapControl = {"numbers": number_layers, "polygon": poly_layers};

    //polygon outlines and counts/stats
    var polygonData = {"county": fgsData, "coarse": coarseData, "fine": fineData};


    //Set defaults
    var active_number = "stats";
    var active_polys = "county";

    //data containers
    var geojson = {}; //Layer manager
    var grid_sizes = {"county": "county", "coarse": "15", "fine": "60"};
    var processedTweetInfo = {
      "county": {"stats": {}, "count": {}, "embed": {}},
      "coarse": {"stats": {}, "count": {}, "embed": {}},
      "fine":   {"stats": {}, "count": {}, "embed": {}},
    }; //Processed input (summed over time)

    //The times in the input JSON
    var time_keys;
    var default_min = -24 * 60 + 1;
    var default_max = 0;
    //var current_min = -default_min;
    //var current_max = -default_max;

    //stats stuff
    var B = 1407; //countyStats["cambridgeshire"].length; //number of stats days


    //Clicked a county
    let clicked: any = "";
    var changed_polys = false;


    //bind various function arguments to default
    var colorData = {
      stats: {values: [5, 2.5, 1, 0.5], colors: ['#FEE5D9', '#FCAE91', '#FB6A4A', '#DE2D26', '#A50F15']},
      count: {values: [150, 50, 20, 10], colors: ['#045A8D', '#2B8CBE', '#74A9CF', '#BDC9E1', '#F1EEF6']}
    };
    var colorFunctions = {stats: {}, count: {}};
    for (var key in colorData) {
      colorFunctions[key].getColor = getColor.bind(null, colorData[key].values, colorData[key].colors);
      colorFunctions[key].getFeatureStyle = getFeatureStyle.bind(null, colorData[key].values, colorData[key].colors,
                                                                 key);
    }

    /////////////////////////
    //React to Mouse
    /////////////////////////
    function highlightFeature(e) {
      dohighlightFeature(e.target);
      tinfo.update_header(e.target.feature);
    }

    function displayText(e) {
      tinfo.update_table(e.target.feature, processedTweetInfo[active_polys]["embed"][e.target.feature.properties.name]);
    }

    function resetHighlight(e) {
      geojson[active_number].resetStyle(e.target);
      tinfo.update_header();
      if (clicked != "") {
        dohighlightFeature(clicked.target);
      }
    }

    function zoomToFeature(e) {
      displayText(e);
      var old_clicked = clicked;
      clicked = e;
      e.target.setStyle({
                          weight:      3,
                          color:       '#FF00FF',
                          dashArray:   '',
                          fillOpacity: 0.4
                        });
      if (old_clicked != "") {
        resetHighlight(old_clicked);
      }
    }

    function onEachFeature(feature, layer) {
      layer.on({
                 mouseover: highlightFeature,
                 mouseout:  resetHighlight,
                 click:     zoomToFeature
               });
    }


    ///////////////////////
    //Add the polygons
    ///////////////////////
    function resetLayers(clear_click) {
      for (key in basemapControl["numbers"]) {

        number_layers[key].clearLayers();

        geojson[key] = new GeoJSON(polygonData[active_polys], {
          style:         colorFunctions[key].getFeatureStyle,
          onEachFeature: onEachFeature
        }).addTo(number_layers[key]);

        if (clear_click) {
          if (clicked != "") {
            geojson[active_number].resetStyle(clicked);
          }
          clicked = "";
        }
      }
    }


    ////////////////////////////
    //Legend
    ////////////////////////////

    class LegendControl extends Control {
      _div = DomUtil.create('div', 'legend');

      update() {
        this._div.innerHTML = makeLegend(colorData[active_number].values, colorData[active_number].colors,
                                         colorFunctions[active_number].getColor);
      };

      onAdd(map) {
        this.update();
        return this._div;
      };
    }

    var legend = new LegendControl();
    legend.addTo(map);

    ////////////////////////////
    //Tweet Panel define Jquery mouse handling and minimise
    ////////////////////////////
    tinfo.addTo(map);

    $('.tinfo').on('mouseover', function (event) {
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
      map.dragging.disable();
    });
    $('.tinfo').on('mouseleave', function (event) {
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      map.dragging.enable();
    });
    $(".tinfo_button").on('click', function (event) {
      if ($(this).html() == "-") {
        $(this).html("+");
        $(".tinfo").css({
                          "height":     "5vh",
                          "width":      "5vh",
                          "transition": "all 1s",
                        });
        $(".tinfo_h4").hide();
        $(".tinfo_h4b").hide();
        $(".tinfo_table_wrapper").hide()
      } else {
        $(this).html("-");
        $(".tinfo").css({
                          "height":     "85vh",
                          "width":      "41vw",
                          "transition": "all 1s"
                        });
        $(".tinfo_h4").show();
        $(".tinfo_h4b").show();
        $(".tinfo_table_wrapper").show()
      }
    });

    ////////////////////////////
    //count / stats toggle
    ////////////////////////////
    var lcontrols = {};
    for (key in basemapControl) {
      lcontrols[key] = control.layers(basemapControl[key], {}).addTo(map);
      lcontrols[key].setPosition('topleft');
    }


    //todo remove :any
    map.on('baselayerchange', function (e: any) {
      if (e.name in basemapControl["polygon"]) {
        active_polys = e.name;
        resetLayers(true)
      } else {
        active_number = e.name;
        legend.update()
      }
    });


    /////////////////////////////
    //get datafiles & init
    /////////////////////////////
    const read_data = () => {
      this.load("live.json",0,(tweet_json) => {
            this.tweetInfo = tweet_json;
            time_keys = getTimes(this.tweetInfo);
            processData(this.tweetInfo, processedTweetInfo, polygonData, this.stats, B,
                        time_keys.slice(-default_max, -default_min), grid_sizes);
            resetLayers(false);
            tinfo.update_header();
            initSlider();
          }).catch(function (e) {
        console.log("Loading data failed " + e);
        console.log(e);
      });

    };

    read_data(); //reads
    // data and sets up map
    setInterval(function () {
      read_data();
    }, 60000);


    ///////////////////////////
    //jQuery Slider, starup after reading JSON
    ///////////////////////////
    const initSlider = () => {
      if (time_keys) {

        timeslider.addTo(map);
        default_min = Math.max(default_min, -(time_keys.length - 1));

        //Add the initial header
        $(function () {
          //console.log("timeslider", cleanDate(time_keys[-default_min], 0), cleanDate(time_keys[-default_max], 1) )
          $(".timeslider_input")
            .val(cleanDate(time_keys[-default_min], 0) + " - " + cleanDate(time_keys[-default_max], 1));

        });

        //how to react to moving the slider
        $(() => {
          ($(".timeslider") as any).slider({
                                             range:  true,
                                             min:    -time_keys.length + 1,
                                             max:    0,
                                             values: [default_min, default_max],
                                             slide:  (event, ui) => {

                                               default_max = ui.values[1];
                                               default_min = ui.values[0];
                                               processData(this.tweetInfo, processedTweetInfo, polygonData, this.stats,
                                                           B, time_keys.slice(-ui.values[1], -ui.values[0]),
                                                           grid_sizes);
                                               resetLayers(false);
                                               tinfo.update_header();
                                               if (clicked != "") {
                                                 displayText(clicked);
                                               }

                                               $(".timeslider_input")
                                                 .val(cleanDate(time_keys[-ui.values[0]], 0) + " - " + cleanDate(
                                                   time_keys[-ui.values[1]], 1));
                                             }
                                           });
        });

        //Don't interact with the map while in the slider
        $('.timeslider_container').on('mouseover', function (event) {
          map.touchZoom.disable();
          map.doubleClickZoom.disable();
          map.scrollWheelZoom.disable();
          map.boxZoom.disable();
          map.keyboard.disable();
          map.dragging.disable();
        });
        $('.timeslider_container').on('mouseleave', function (event) {
          map.touchZoom.enable();
          map.doubleClickZoom.enable();
          map.scrollWheelZoom.enable();
          map.boxZoom.enable();
          map.keyboard.enable();
          map.dragging.enable();
        });

      }
    }


  }

}
