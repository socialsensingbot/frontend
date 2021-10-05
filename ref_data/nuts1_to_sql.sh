
#https://datahub.io/core/geo-countries#curl


function process() {

while read x
do

  geo=$( cat $1 | jq --arg locid "$x" -c '.features[] | select(.properties.nuts118cd == $locid) | .geometry' | sed "s/\n//g")
  region=$( cat $1 | jq --arg locid "$x" -c '.features[] | select(.properties.nuts118cd == $locid) | .properties.nuts118cd' | sed "s/\n//g")
  title=$( cat $1 | jq --arg locid "$x" -c '.features[] | select(.properties.nuts118cd == $locid) | .properties.nuts118nm' | sed "s/\n//g")
  echo "replace into ref_geo_regions (map_location,region_type,region,boundary,title) VALUES ('uk','nuts1','$region', ST_GeomFromGeoJSON('$geo'),'$title');"

done

}

cat  nuts1.geojson |  jq -cr ".features[].properties.nuts118cd" | process nuts1.geojson > nuts1.sql
