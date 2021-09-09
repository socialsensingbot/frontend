# https://fromdual.com/mysql-materialized-views

DROP PROCEDURE refresh_mv_now;

DELIMITER $$
CREATE PROCEDURE refresh_mv_now(
    OUT rc INT
)
BEGIN

    -- rollback transaction and bubble up errors if something bad happens
    DECLARE exit handler FOR SQLEXCEPTION, SQLWARNING
        BEGIN
            ROLLBACK;
        END;


    START TRANSACTION;

    SET @maxTimestamp = (select max(source_timestamp) from mat_view_regions_and_layers);

    REPLACE INTO mat_view_regions_and_layers
    SELECT t.source_id, t.source, t.hazard, source_timestamp, layer_group_id, region_type, region
    FROM live_text t
             left join
         live_text_regions tr on tr.source_id = t.source_id and tr.source = t.source and tr.hazard = t.hazard,
         ref_map_layer_groups_mapping lgm,
         ref_map_layers l
    WHERE source_timestamp >= @maxTimestamp
      AND t.source = l.source
      AND t.hazard = l.hazard
      AND l.id = lgm.layer_id
      AND NOT deleted;
    COMMIT;

    SET rc = 0;
END;
$$

DELIMITER ;
