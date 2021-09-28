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
           IFNULL(t.deleted, false)
    FROM live_text t,
         live_text_regions tr
    WHERE tr.source_id = t.source_id
      AND tr.source = t.source
      AND tr.hazard = t.hazard
      AND t.source_html IS NOT NULL
      AND t.source_timestamp >= @maxTimestamp - INTERVAL 4 DAY;
    COMMIT;

    START TRANSACTION;

    SET @maxTimestampTSD = IFNULL((select max(source_date) from mat_view_timeseries_date), NOW() - INTERVAL 20 YEAR);
    REPLACE INTO mat_view_timeseries_date
    SELECT rrg.parent               as region_group_name,
           t.source                 as source,
           t.hazard                 as hazard,
           t.warning                as warning,
           t.source_date            as source_date,
           t.source_text            as source_text,
           vr.region_type           as region_type,
           IFNULL(t.deleted, false) as deleted
    FROM live_text_regions vr,
         live_text t,
         ref_region_groups as rrg
    WHERE vr.region = rrg.region
      AND t.source_id = vr.source_id
      AND t.source = vr.source
      AND t.hazard = vr.hazard
      AND t.source_html IS NOT NULL
      AND t.source_date >= @maxTimestampTSD - INTERVAL 4 DAY;
    COMMIT;

    SET rc = 0;
END;
$$

DELIMITER ;
