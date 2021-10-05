process() {

  while read x; do

    geo=$(cat $1 | jq --arg locid "$x" -c '.features[] | select(.properties.id == $locid) | .geometry' | sed "s/\n//g")
    region=$x
    title=$(cat $1 | jq --arg locid "$x" -c '.features[] | select(.properties.id == $locid) | .properties.name' | sed "s/\n//g")
    echo "replace into ref_geo_regions (map_location,region_type,region,boundary,title) VALUES ('uk','countries','$region', ST_GeomFromGeoJSON('$geo'),'$title');"

  done

}

cat uk_countries.geojson | jq -cr ".features[].properties.id" | process uk_countries.geojson >uk_countries.sql
