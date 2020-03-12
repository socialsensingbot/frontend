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
// control that shows tweets on click
export var tinfo = control({position: 'bottomleft'});

tinfo.onAdd = function (map) {
	//div the tweets sit in
	this._div = DomUtil.create('div', 'tinfo');
	//minimise button
	this._button  = DomUtil.create('button', 'tinfo_button', this._div);
	this._button.innerHTML = '-';
	//headers
	this._h4  = DomUtil.create('h4', 'tinfo_h4', this._div);
	this._h4b  = DomUtil.create('h4', 'tinfo_h4b', this._div);
	//table of tweets
	this._table_wrapper  = DomUtil.create('div', 'tinfo_table_wrapper', this._div);
	this._table  = DomUtil.create('div', 'tinfo_table', this._table_wrapper);

	//separate the header info from the html element for some reason...
	this.header_info = "";
	this.header_infob = "";

	return this._div;
};

tinfo.full_update = function (props) {
	tinfo.update_header(props);
	tinfo.update_table(props);
	tinfo.update_html_header(props);
	tinfo.update_html_table(props)
};

tinfo.update_header = function(props) {
	if(props && props.properties.count){
		var count = Math.round( props.properties.count*100 )/100;
		var stats = Math.round( props.properties.stats*100 )/100;

		var header_info = '<span style="color: black"><b>' + props.properties.name + '</b>:</span> ' + count
		+ ' tweets. Exceedence probability ' + stats + '% </h4>';

	} else {
		var header_info = 'Hover over a county';
	}

	//if( earliest != ""){header_info += "</br>Last Update: " + latest; }
	this._h4.innerHTML = header_info;
	//this._h4b.innerHTML = this.header_infob;
};

tinfo.update_table = function(props, embeds) {

	if(props.properties.count > 0){

		var count = Math.round( props.properties.count*100 )/100;
		var stats = Math.round( props.properties.stats*100 )/100;

		this._table.innerHTML =
		'<h4><span style="color: black"><b>Showing ' + count +
		' Tweets from ' + props.properties.name  +
		'</b>:</span> Exceedence probability ' + stats + '% </h4>' +
		'<table class=table_info>' + embeds + '</table>';

		twttr.widgets.load( $("#tinfo")[0] );

	} else {
		this._table.innerHTML = ""
	}

};
