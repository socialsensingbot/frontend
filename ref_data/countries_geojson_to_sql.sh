
#https://datahub.io/core/geo-countries#curl


function process() {

while read x
do

  geo=$( cat $1 | jq --arg locid "$x" -c '.features[] | select(.properties.ADMIN == $locid) | .geometry' | sed "s/\n//g")
  iso=$( cat $1 | jq --arg locid "$x" -c '.features[] | select(.properties.ADMIN == $locid) | .properties.ISO_A3' | sed "s/\n//g")
  echo "replace into ref_geo_regions (map_location,region_type,region,boundary,title) VALUES ('world','iso_countries','$iso', ST_GeomFromGeoJSON('$geo'),'$x');"

done

}

cat $1 |  jq -cr ".features[].properties.ADMIN" | process $1 $2 > iso_countriess.sql
