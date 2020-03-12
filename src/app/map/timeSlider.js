export var timeslider = L.control({position: 'topright'});
timeslider.onAdd = function (map) {
	this._div = L.DomUtil.create('div', 'timeslider_container');
	this._input  = L.DomUtil.create('input', 'timeslider_input', this._div);
	this._slider = L.DomUtil.create('div', 'timeslider', this._div);
	return this._div;
};

//add = extra minutes
export function cleanDate(tstring, add){
	var date = new Date( tstring.substring(0,4), tstring.substring(4,6)-1, tstring.substring(6,8), tstring.substring(8,10), +tstring.substring(10,12) + add, 0, 0);
	//var date = new Date( tstring.substring(0,4), tstring.substring(4,6)-1, tstring.substring(6,8), +tstring.substring(8,10)+add, 0, 0, 0);
	return date.toLocaleDateString() + " " + date.toLocaleTimeString()
}
