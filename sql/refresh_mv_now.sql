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

    SET @maxTimestamp = IFNULL((select max(source_timestamp) from mat_view_regions), NOW() - INTERVAL 20 YEAR);

    REPLACE INTO mat_view_regions
    SELECT t.source_id,
           t.source,
           t.hazard,
           t.source_timestamp,
           tr.region_type,
           tr.region,
           t.warning,
           t.source_text,
           t.source_json,
           t.source_html
    FROM live_text t,
         live_text_regions tr
    where tr.source_id = t.source_id
      and tr.source = t.source
      and tr.hazard = t.hazard
      and NOT deleted
      and t.source_timestamp >= @maxTimestamp
    ORDER BY source_timestamp DESC;
    COMMIT;

    START TRANSACTION;

    SET @maxTimestampTSD = IFNULL((select max(source_date) from mat_view_timeseries_date), NOW() - INTERVAL 20 YEAR);
    replace into mat_view_timeseries_date
    select rrg.parent     as region_group_name,
           t.source       as source,
           t.hazard       as hazard,
           t.warning      as warning,
           t.source_date  as source_date,
           t.source_text  as source_text,
           vr.region_type as region_type
    FROM live_text_regions vr,
         live_text t,
         ref_region_groups as rrg
    WHERE vr.region = rrg.region
      and t.source_id = vr.source_id
      and t.source = vr.source
      and t.hazard = vr.hazard
      and t.source_date >= @maxTimestampTSD;


    SET rc = 0;
END;
$$

DELIMITER ;
