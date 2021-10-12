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
    REPLACE INTO mat_view_first_entries
    SELECT min(source_timestamp) as source_timestamp, hazard, source
    FROM mat_view_regions
    GROUP BY hazard, source;
    COMMIT;

    START TRANSACTION;

#     delete from mat_view_regions where source_timestamp < NOW() - INTERVAL 1 YEAR;

    SET @maxTimestamp = IFNULL((select max(source_timestamp) from mat_view_regions), NOW() - INTERVAL 20 YEAR);

    REPLACE INTO mat_view_regions
    SELECT t.source_id,
           t.source,
           t.hazard,
           t.source_timestamp,
           gr.region_type,
           gr.region,
           t.warning,
           IFNULL(t.deleted, false) as deleted
    FROM live_text t,
         ref_geo_regions gr
    WHERE ST_Contains(boundary, location)


      AND t.source_timestamp >= @maxTimestamp - INTERVAL 4 DAY;
    COMMIT;

    START TRANSACTION;

    SET @maxTimestampTSD = IFNULL((select max(source_date) from mat_view_timeseries_date), NOW() - INTERVAL 20 YEAR);
    REPLACE INTO mat_view_timeseries_date
    SELECT r.region                 as region_group_name,
           t.source                 as source,
           t.hazard                 as hazard,
           t.warning                as warning,
           t.source_date            as source_date,
           t.source_text            as source_text,
           r.region_type            as region_type,
           IFNULL(t.deleted, false) as deleted,
           t.source_id              as source_id
    FROM mat_view_regions r,
         live_text t
    WHERE t.source_id = r.source_id
      AND t.source = r.source
      AND t.hazard = r.hazard
      AND t.source_date >= @maxTimestampTSD - INTERVAL 4 DAY;
    COMMIT;

    SET @maxTimestampTSH = IFNULL((select max(source_date) from mat_view_timeseries_hour), NOW() - INTERVAL 20 YEAR);
    REPLACE INTO mat_view_timeseries_hour
    SELECT r.region                                                         as region_group_name,
           t.source                                                         as source,
           t.hazard                                                         as hazard,
           t.warning                                                        as warning,
           cast(date_format(t.source_timestamp, '%Y-%m-%d %H') as DATETIME) as source_date,
           t.source_text                                                    as source_text,
           r.region_type                                                    as region_type,
           IFNULL(t.deleted, false)                                         as deleted,
           t.source_id                                                      as source_id
    FROM mat_view_regions r,
         live_text t
    WHERE t.source_id = r.source_id
      AND t.source = r.source
      AND t.hazard = r.hazard
      AND t.source_date >= @maxTimestampTSD - INTERVAL 4 DAY;
    COMMIT;


    SET rc = 0;
END;
$$

DELIMITER ;
