update ref_geo_regions
set buffered=boundary;
update ref_geo_regions
set centroid=(st_geomfromtext(st_astext(st_centroid(st_geomfromtext(st_astext(boundary), 0))), 4326));
update ref_geo_regions
set envelope=(st_geomfromtext(st_astext(st_envelope(st_geomfromtext(st_astext(boundary), 0))), 4326));
update ref_geo_regions
set buffered=(st_geomfromtext(st_astext(st_buffer(st_geomfromtext(st_astext(boundary), 0), 0.01)), 4326))
where map_location = 'uk';
alter table ref_geo_regions
    modify centroid geometry SRID 4326 not null;
alter table ref_geo_regions
    modify envelope geometry SRID 4326 not null;
alter table ref_geo_regions
    modify buffered geometry SRID 4326 not null;
ALTER TABLE ref_geo_regions
    ADD SPATIAL INDEX (centroid);
ALTER TABLE ref_geo_regions
    ADD SPATIAL INDEX (envelope);
ALTER TABLE ref_geo_regions
    ADD SPATIAL INDEX (buffered);



update ref_geo_regions
set boundary=(st_geomfromtext(st_astext(st_buffer(st_geomfromtext(st_astext(boundary), 0), 0.001)), 4326))
where map_location = 'uk'
  and st_validate(boundary) is null;


optimize table ref_geo_regions;

select region, st_asgeojson(boundary)
from ref_geo_regions
where st_validate(boundary) is null;
