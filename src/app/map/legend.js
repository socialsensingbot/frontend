export function makeLegend(values, colors, getColor) {

		var labels = [];
		var from, to;

		for (var i = 0; i < values.length; i++) {
			from = values[i];
			to = values[i + 1];
			labels.push('<i style="background:' + getColor(from) + '"></i> ' +from + (to ? '&ndash;' + to : '&ndash;0'));
		}

		return labels.join('<br>');
}
