# https://fromdual.com/mysql-materialized-views


# This will update the materialized view's last hour of data every 5 minutes. Effectively keeping the view 'live'
# Note that some Twitter retractions will be missed in this but caught in refresh_mv_map_window
DROP PROCEDURE IF EXISTS refresh_mv_now;
DELIMITER $$
CREATE PROCEDURE refresh_mv_now(
    OUT rc INT
)
BEGIN

    call refresh_mv(DATE_SUB(NOW(), INTERVAL 1 HOUR), NOW(), @rc);
    SET rc = 0;
END;
$$

DELIMITER ;

# This makes sure that any deletions performed for Twitter compliance are reflected in the materialzed view for
# the time window displayed on the map (4 days).

DROP PROCEDURE IF EXISTS refresh_mv_map_window;
DELIMITER $$
CREATE PROCEDURE refresh_mv_map_window(
    OUT rc INT
)
BEGIN

    call refresh_mv(DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY), @rc);
    SET rc = 0;
END;
$$

DELIMITER ;


#This does a daily historical refresh of the materialized view to include new regions / region types that
#have been added in the last day. Because this is such a long process it is done in 1 MONTH segments.
DROP PROCEDURE IF EXISTS refresh_mv_full;

DELIMITER $$
CREATE PROCEDURE refresh_mv_full(
    OUT rc INT
)
BEGIN


    DECLARE dt DATE DEFAULT DATE_SUB(NOW(), INTERVAL 10 YEAR);

    WHILE dt <= NOW()
        DO
            CALL refresh_mv(dt, DATE_ADD(dt, INTERVAL 1 MONTH), @rc);
            SET dt = DATE_ADD(dt, INTERVAL 1 MONTH);
        END WHILE;

    START TRANSACTION;
    REPLACE INTO mat_view_first_entries
    SELECT min(source_timestamp) as source_timestamp, hazard, source
    FROM mat_view_regions
    GROUP BY hazard, source;
    COMMIT;

    SET rc = 0;
END;
$$

DELIMITER ;


DROP PROCEDURE IF EXISTS refresh_mv;

DELIMITER $$
CREATE PROCEDURE refresh_mv(
    IN start_date DATETIME,
    IN end_date DATETIME,
    OUT rc INT
)
BEGIN

    -- rollback transaction and bubble up errors if something bad happens
    DECLARE exit handler FOR SQLEXCEPTION, SQLWARNING
        BEGIN
            ROLLBACK;
        END;

    call debug_msg(CONCAT('Start Date: ', start_date));
    call debug_msg(CONCAT('End Date: ', end_date));

    START TRANSACTION;

    #     delete from mat_view_regions where source_timestamp < NOW() - INTERVAL 1 YEAR;

#     SET @maxTimestamp = IFNULL((select max(source_timestamp) from mat_view_regions), NOW() - INTERVAL 20 YEAR);

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
      AND t.source_timestamp BETWEEN start_date and end_date;
    COMMIT;
    call debug_msg('Updated mat_view_regions');

    START TRANSACTION;

#     SET @maxTimestampTSD = IFNULL((select max(source_date) from mat_view_timeseries_date), NOW() - INTERVAL 20 YEAR);
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
      and not r.region REGEXP '^[0-9]+$'
      AND t.source_timestamp BETWEEN start_date and end_date;
    COMMIT;
    call debug_msg('Updated mat_view_timeseries_date');

    START TRANSACTION;

#     SET @maxTimestampTSH = IFNULL((select max(source_date) from mat_view_timeseries_hour), NOW() - INTERVAL 20 YEAR);
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
      and not r.region REGEXP '^[0-9]+$'
      AND t.source_timestamp BETWEEN start_date and end_date;
    COMMIT;
    call debug_msg('Updated mat_view_timeseries_hour');

    START TRANSACTION;

    REPLACE INTO mat_view_hours
    SELECT DISTINCT source_date AS DATE
    from mat_view_timeseries_hour
    WHERE source_date BETWEEN start_date AND end_date;
    call debug_msg('Updated mat_view_hours');

    REPLACE INTO mat_view_days
    SELECT DISTINCT source_date AS DATE
    from mat_view_timeseries_date
    WHERE source_date BETWEEN start_date AND end_date;
    COMMIT;
    call debug_msg('Updated mat_view_hours');

    SET rc = 0;
END;
$$

DELIMITER ;


DROP EVENT IF EXISTS mv_full_refresh_event;
CREATE EVENT mv_full_refresh_event
    ON SCHEDULE EVERY 1 DAY
        STARTS '2014-01-18 00:00:00'
    DO CALL refresh_mv_full(@rc);

DROP EVENT IF EXISTS mv_map_window_refresh_event;
CREATE EVENT mv_map_window_refresh_event
    ON SCHEDULE EVERY 4 HOUR
        STARTS '2014-01-18 00:00:00'
    DO CALL refresh_mv_map_window(@rc);

DROP EVENT IF EXISTS mv_latest_refresh_event;
CREATE EVENT mv_latest_refresh_event
    ON SCHEDULE EVERY 5 MINUTE
        STARTS '2014-01-18 00:00:00'
    DO CALL refresh_mv_now(@rc);
