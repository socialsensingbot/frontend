function process() {

while read x
do

  geo=$( cat $1 | jq --arg locid "$x" -c '.features[] | select(.id == $locid) | .geometry' )
  echo "insert into ref_geo_regions (map,region_type,region,boundary) VALUES ('uk','county','$x', ST_GeomFromGeoJSON('$geo'));"

done

}

cat $1 |  jq -cr ".features[].id" | process $1 > ~/tmp/geo_features.sql
