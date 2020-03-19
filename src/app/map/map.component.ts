import {Component} from '@angular/core';
import {fgsData} from './county_bi';
import {coarseData} from './coarse_bi';
import {fineData} from './fine_bi';
import {dohighlightFeature, getColor, getFeatureStyle} from './layerStyle';
import {makeLegend} from './legend';
import {tinfo} from './tweetPanel';
import {fineBox} from './fineBox.js';
import {coarseBox} from './coarseBox.js';
import {getTimes, processData} from './processTweets';
import {cleanDate, timeslider} from './timeSlider';
import {Storage} from 'aws-amplify';
import {
  control,
  Control,
  ControlOptions,
  DomUtil,
  GeoJSON,
  latLng,
  Layer, LayerGroup,
  layerGroup,
  LeafletMouseEvent,
  Map,
  tileLayer
} from 'leaflet';
import * as $ from 'jquery';
import 'jquery-ui/ui/widgets/slider.js';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {Observable} from "rxjs";
import * as geojson from "geojson";

////////////////////////////
//Legend
////////////////////////////
class LegendControl extends Control {
  _div = DomUtil.create('div', 'legend');
  private mapComp: MapComponent;


  constructor(options: ControlOptions, mapComp: MapComponent) {
    super(options);
    this.mapComp = mapComp;
  }

  update() {
    console.log("LegendControl.update()");

    this._div.innerHTML = makeLegend((this.mapComp._colorData)[(this.mapComp._activeNumber)].values,
                                     (this.mapComp._colorData)[(this.mapComp._activeNumber)].colors,
                                     (this.mapComp._colorFunctions)[(this.mapComp._activeNumber)].getColor);
  };

  onAdd(map) {
    console.log("LegendControl.onAdd()");
    this.update();
    return this._div;
  };
}


@Component({
             selector:    'app-map',
             templateUrl: './map.component.html',
             styleUrls:   ['./map.component.scss']
           })
export class MapComponent {
  private twitter: any;
  private _tweetInfo: any = {};
  private stats_layer = layerGroup();
  private count_layer = layerGroup();
  private layer_polys = {"county": fgsData, "fine": fineBox, "coarse": coarseBox};
  private county_layer = layerGroup(); //dummy layers to fool layer control
  private coarse_layer = layerGroup();
  private fine_layer = layerGroup();

  private _searchParams: Observable<Params>;
  private _map: Map;
  private _legend: LegendControl;
  private _numberLayers: { "stats": LayerGroup, "count": LayerGroup } = {"stats": null, "count": null};
  private _polyLayers: { "county": LayerGroup, "coarse": LayerGroup, "fine": LayerGroup } = {
    "county": null,
    "coarse": null,
    "fine":   null
  };
  private _basemapControl: any;
  private _polygonData = {"county": fgsData, "coarse": coarseData, "fine": fineData};
  public _activeNumber: string = "stats";
  private _activePolys: string = "county";
  private _geojson = {};
  private _gridSizes = {"county": "county", "coarse": "15", "fine": "60"};
  private _processedTweetInfo = {
    "county": {"stats": {}, "count": {}, "embed": {}},
    "coarse": {"stats": {}, "count": {}, "embed": {}},
    "fine":   {"stats": {}, "count": {}, "embed": {}},
  };
  public _colorData = {
    stats: {values: [5, 2.5, 1, 0.5], colors: ['#FEE5D9', '#FCAE91', '#FB6A4A', '#DE2D26', '#A50F15']},
    count: {values: [150, 50, 20, 10], colors: ['#045A8D', '#2B8CBE', '#74A9CF', '#BDC9E1', '#F1EEF6']}
  };

  public _colorFunctions = {stats: {}, count: {}};
  private _oldClicked: (LeafletMouseEvent | "") = "";
  private clicked: (LeafletMouseEvent | "") = "";
  private _timeKeys: any; //The times in the input JSON
  private _defaultMax = 0;
  private _defaultMin = -24 * 60 + 1;
  private _changedPolys: boolean = false;
  private _lcontrols: { "numbers": Control.Layers, "polygon": Control.Layers } = {"numbers": null, "polygon": null};
  private _B: number = 1407;//countyStats["cambridgeshire"].length; //number of stats days
  private _params: Params;

  updateSearch(params: Partial<Params>) {
    console.log("updateSearch");

    return this._router.navigate([], {
      queryParams:         params,
      queryParamsHandling: 'merge'
    })
  }

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

  constructor(private _router: Router, private route: ActivatedRoute) {
    //save the query parameter observable
    this._searchParams = this.route.queryParams;

    //Every time the search parameters change, the map will be updated
    this._searchParams.subscribe(params => this.updateMap(params));

    // Preload the cacheable JSON files asynchronously
    // this gets called again in onMapReady()
    // But the values should be in the browser cache by then
    this.fetchJson().then(() => {});
  }

  /**
   * Called when the map element has finished initialising.
   * @param map
   */
  onMapReady(map: Map) {
    console.log("onMapReady");

    this._map = map;
    this.fetchJson()
        .then(() => this.init(map))
        .catch(err => console.log(err));
  }

  /**
   * Fetches the (nearly) static JSON files (see the src/assets/data directory in this project)
   */
  private fetchJson(): Promise<any> {
    console.log("fetchJson");
    return fetch("assets/data/county_stats.json")
      .then(response => response.json())
      .then(json => {
        this.stats.county = json;
      })
      .then(() =>
              fetch("assets/data/coarse_stats.json")
                .then(response => response.json())
                .then(json => {
                  this.stats.coarse = json;
                }))
      .then(() => fetch("assets/data/fine_stats.json")
        .then(response => response.json())
        .then(json => {
          this.stats.fine = json;
        }));
  }

  /**
   * Update the map from the query parameters.
   *
   * @param params the new value for the query parameters.
   */
  private updateMap(params: Params) {
    console.log("Updating map with params");
    console.log(params);
    this._params = params;
    const {lng, lat, zoom, active_number, active_polygon,min_offset,max_offset} = params;
    if (typeof lat != "undefined" && typeof lng != "undefined") {
      this.options.center = latLng(lat, lng);
    }
    if (typeof zoom != "undefined") {
      this.options.zoom = zoom;
    }


    // if (typeof active_polys != "undefined") {
    //   this.options.zoom = zoom;
    // }

    const numberLayerName = typeof active_number !== "undefined" ? active_number : "stats";
    const numberLayer: LayerGroup = this._numberLayers[numberLayerName];
    if (this._map) {
      for (let layer in this._numberLayers) {
        if (layer !== numberLayerName) {
          console.log("Removing " + layer);
          this._map.removeLayer(this._numberLayers[layer]);
        }
      }
      for (let layer in this._numberLayers) {
        if (layer === numberLayerName) {
          console.log("Adding " + layer);
          this._map.addLayer(this._numberLayers[layer]);

        }
      }
    }
    const polygonLayerName = typeof active_polygon !== "undefined" ? active_polygon : "county";
    const polygonLayer: LayerGroup = this._polyLayers[polygonLayerName];
    if (this._map) {
      for (let layer in this._polyLayers) {
        if (layer !== polygonLayerName) {
          console.log("Removing " + layer);
          this._map.removeLayer(this._polyLayers[layer]);
        }
      }
      for (let layer in this._polyLayers) {
        if (layer === polygonLayerName) {
          console.log("Adding " + layer);
          this._map.addLayer(this._polyLayers[layer]);

        }
      }
    }

    if(typeof min_offset !== "undefined" && typeof min_offset !== "undefined")
    ($(".timeslider") as any).slider("option", "values", [min_offset, max_offset]);

    return undefined;
  }

  /**
   * Loads the live data from S3 storage securely.
   */
  private loadLiveData() {
    console.log("loadLiveData");
    return Storage.get("live.json")
                  .then((url: any) =>
                          fetch(url.toString())
                            .then(response => response.json()));
  }


  /**
   * This method does all the heavy lifting and is called when
   * the map is ready and data is loaded.
   * @param map the leaflet.js Map
   */
  private init(map: Map) {
    console.log("init");
    map.addEventListener("dragend", () => {
      return this.updateSearch({lat: this._map.getCenter().lat, lng: this._map.getCenter().lng})
    });

    map.addEventListener("zoomend", () => {
      return this.updateSearch({zoom: this._map.getZoom()})
    });


    //define the layers for the different counts
    this._numberLayers.stats = layerGroup().addTo(map);
    this._numberLayers.count = layerGroup();

    //layers for the different polygons
    this._polyLayers["county"] = layerGroup().addTo(map);
    this._polyLayers["coarse"] = layerGroup();
    this._polyLayers["fine"] = layerGroup();

    this._basemapControl = {"numbers": this._numberLayers, "polygon": this._polyLayers};

    //The times in the input JSON

    //var current_min = -default_min;
    //var current_max = -default_max;
    for (let key in this._colorData) {
      this._colorFunctions[key].getColor = getColor.bind(null, this._colorData[key].values,
                                                         this._colorData[key].colors);
      this._colorFunctions[key].getFeatureStyle = getFeatureStyle.bind(null, this._colorData[key].values,
                                                                       this._colorData[key].colors,
                                                                       key);
    }


    this._legend = new LegendControl({}, this);
    this._legend.addTo(map);

    this.setupTwitterPanel();
    this.setupCountStatsToggle();
    this.readData(); //reads data and sets up map
    setInterval(() => this.readData(), 60000);

    map.on('baselayerchange', (e: any) => {
      if (e.name in this._basemapControl["polygon"]) {
        this._activePolys = e.name;
        this.updateSearch({active_polygon: e.name});
        this.resetLayers(true);
      } else {
        this._activeNumber = e.name;
        this.updateSearch({active_number: e.name});
        this._legend.update();
      }
    });

    //Use the current query parameters to update map state
    this.updateMap(this._params);
    // ($(".timeslider") as any).slider.options.values = [-1, 0];
    // ($(".timeslider") as any).slider.values = [-1, 0];

  }


  private setupCountStatsToggle() {
    ////////////////////////////
    //count / stats toggle
    ////////////////////////////
    for (let key in this._basemapControl) {
      // noinspection JSUnfilteredForInLoop
      this._lcontrols[key] = control.layers(this._basemapControl[key], {}).addTo(this._map);
      // noinspection JSUnfilteredForInLoop
      this._lcontrols[key].setPosition('topleft');
    }

  }

  private setupTwitterPanel() {
    console.log("setupTwitterPanel");

    ////////////////////////////
    //Tweet Panel define Jquery mouse handling and minimise
    ////////////////////////////
    tinfo.addTo(this._map);

    const $tinfo = $('.tinfo');
    $tinfo.on('mouseover', () => {
      this._map.touchZoom.disable();
      this._map.doubleClickZoom.disable();
      this._map.scrollWheelZoom.disable();
      this._map.boxZoom.disable();
      this._map.keyboard.disable();
      this._map.dragging.disable();
    });
    $tinfo.on('mouseleave', () => {
      this._map.touchZoom.enable();
      this._map.doubleClickZoom.enable();
      this._map.scrollWheelZoom.enable();
      this._map.boxZoom.enable();
      this._map.keyboard.enable();
      this._map.dragging.enable();
    });
    $(".tinfo_button").on('click', function () {
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
  }

  /////////////////////////
  //React to Mouse
  /////////////////////////
  public highlightFeature(e: LeafletMouseEvent) {
    console.log("highlightFeature");
    dohighlightFeature(e.target);
    tinfo.update_header(e.target.feature);
  }

  public displayText(e: LeafletMouseEvent) {
    console.log("displayText");
    tinfo.update_table(e.target.feature,
                       this._processedTweetInfo[this._activePolys]["embed"][e.target.feature.properties.name]);
  }

  public resetHighlight(e: LeafletMouseEvent) {
    console.log("resetHighlight");


    this._geojson[this._activeNumber].resetStyle(e.target);
    tinfo.update_header();
    if (this.clicked != "") {
      dohighlightFeature(this.clicked.target);
    }
  }

  zoomToFeature(e: LeafletMouseEvent) {
    console.log("zoomToFeature");
    this.displayText(e);
    this._oldClicked = this.clicked;
    this.clicked = e;
    e.target.setStyle({
                        weight:      3,
                        color:       '#FF00FF',
                        dashArray:   '',
                        fillOpacity: 0.4
                      });
    if (this._oldClicked != "") {
      this.resetHighlight(this._oldClicked);
    }
  }

  onEachFeature(feature: geojson.Feature<geojson.GeometryObject, any>, layer: Layer) {
    console.log("onEachFeature");
    const mc = this;
    layer.on({
               mouseover: (e) => mc.highlightFeature(e),
               mouseout:  (e) => mc.resetHighlight(e),
               click:     (e) => mc.zoomToFeature(e)
             });
  }

  ///////////////////////
  //Add the polygons
  ///////////////////////
  resetLayers(clear_click) {
    console.log("resetLayers");

    for (let key in this._basemapControl["numbers"]) {

      // noinspection JSUnfilteredForInLoop
      this._numberLayers[key].clearLayers();

      // noinspection JSUnfilteredForInLoop
      this._geojson[key] = new GeoJSON(this._polygonData[this._activePolys], {
        style:         (feature) => this._colorFunctions[key].getFeatureStyle(feature),
        onEachFeature: (f, l) => this.onEachFeature(f, l)
      }).addTo(this._numberLayers[key]);

      if (clear_click) {
        console.log("resetLayers clear_click");
        if (this.clicked != "") {
          this._geojson[this._activeNumber].resetStyle(this.clicked);
        }
        this.clicked = "";
      }
    }
  }

  /////////////////////////////
  //get datafiles & init
  /////////////////////////////
  readData() {
    console.log("readData");
    this.loadLiveData()
        .then((tweet_json) => {
          this._tweetInfo = tweet_json;
          this._timeKeys = getTimes(this._tweetInfo);
          processData(this._tweetInfo, this._processedTweetInfo, this._polygonData, this.stats, this._B,
                      this._timeKeys.slice(-this._defaultMax, -this._defaultMin), this._gridSizes);
          this.resetLayers(false);
          tinfo.update_header();
          this.initSlider();
        }).catch((e) => {
      console.log("Loading data failed " + e);
      console.log(e);
    });

  };

  ///////////////////////////
  //jQuery Slider, starup after reading JSON
  ///////////////////////////
  initSlider() {
    console.log("initSlider");
    if (this._timeKeys) {

      timeslider.addTo(this._map);
      this._defaultMin = Math.max(this._defaultMin, -(this._timeKeys.length - 1));

      //Add the initial header
      //TODO: Convert to Angular Material Widget
      $(() => {
        //console.log("timeslider", cleanDate(time_keys[-default_min], 0), cleanDate(time_keys[-default_max], 1) )
        $(".timeslider_input")
          .val(
            cleanDate(this._timeKeys[-this._defaultMin], 0) + " - " + cleanDate(this._timeKeys[-this._defaultMax], 1));

      });

      //how to react to moving the slider
      $(() => {
        ($(".timeslider") as any).slider({
                                           range:  true,
                                           min:    -this._timeKeys.length + 1,
                                           max:    0,
                                           values: [this._defaultMin, this._defaultMax],
                                           slide:  (event, ui) => {

                                             this._defaultMax = ui.values[1];
                                             this._defaultMin = ui.values[0];
                                             this.updateSearch({min_offset: ui.values[0],max_offset:ui.values[1]});
                                             processData(this._tweetInfo, this._processedTweetInfo, this._polygonData,
                                                         this.stats,
                                                         this._B, this._timeKeys.slice(-ui.values[1], -ui.values[0]),
                                                         this._gridSizes);
                                             this.resetLayers(false);
                                             tinfo.update_header();
                                             if (this.clicked != "") {
                                               this.displayText(this.clicked);
                                             }

                                             $(".timeslider_input")
                                               .val(cleanDate(this._timeKeys[-ui.values[0]], 0) + " - " + cleanDate(
                                                 this._timeKeys[-ui.values[1]], 1));
                                           }
                                         });
        this.updateMap(this._params);


      });

      //Don't interact with the map while in the slider
      const $timesliderContainer = $('.timeslider_container');
      $timesliderContainer.on('mouseover', () => {
        this._map.touchZoom.disable();
        this._map.doubleClickZoom.disable();
        this._map.scrollWheelZoom.disable();
        this._map.boxZoom.disable();
        this._map.keyboard.disable();
        this._map.dragging.disable();
      });
      $timesliderContainer.on('mouseleave', () => {
        this._map.touchZoom.enable();
        this._map.doubleClickZoom.enable();
        this._map.scrollWheelZoom.enable();
        this._map.boxZoom.enable();
        this._map.keyboard.enable();
        this._map.dragging.enable();
      });

    }
  }
}
