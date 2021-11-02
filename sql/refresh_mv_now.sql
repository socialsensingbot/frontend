# https://fromdual.com/mysql-materialized-views


# This will update the materialized view's last hour of data every 5 minutes. Effectively keeping the view 'live'
# Note that some Twitter retractions will be missed in this but caught in refresh_mv_map_window
DROP PROCEDURE IF EXISTS refresh_mv_now;
DELIMITER $$
CREATE PROCEDURE refresh_mv_now(
    OUT rc INT
)
BEGIN
    call debug_msg(2, 'refresh_mv_now', 'Refreshing (Latest) Materialized Views');

    call refresh_mv(DATE_SUB(NOW(), INTERVAL 1 HOUR), NOW(), @rc);
    START TRANSACTION;
    call fill_hours(DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_ADD(NOW(), INTERVAL 1 HOUR));
    call debug_msg(1, 'refresh_mv', 'Updated mat_view_hours');
    COMMIT;

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
    call debug_msg(2, 'refresh_mv_map_window', 'Refreshing (Window Duration) Materialized Views');

    call refresh_mv(DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY), @rc);

    START TRANSACTION;
    call fill_days(DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY));
    call debug_msg(1, 'refresh_mv', 'Updated mat_view_days');
    COMMIT;

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


    DECLARE dt DATE DEFAULT '2017-01-01';
    call debug_msg(2, 'refresh_mv_full', 'Refreshing (Full) Materialized Views');

    WHILE dt <= NOW()
        DO
            CALL refresh_mv(dt, DATE_ADD(dt, INTERVAL 1 MONTH), @rc);
            SET dt = DATE_ADD(dt, INTERVAL 1 MONTH);
        END WHILE;

    START TRANSACTION;
    call debug_msg(2, 'refresh_mv_full', 'Refreshing first entries.');

    REPLACE INTO mat_view_first_entries
    SELECT min(source_timestamp) as source_timestamp, hazard, source
    FROM mat_view_regions
    GROUP BY hazard, source;
    COMMIT;

    optimize table mat_view_timeseries_date;
    optimize table mat_view_timeseries_hour;
    optimize table mat_view_regions;
    optimize table mat_view_first_entries;

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
    call debug_msg(2, 'refresh_mv', 'Refreshing Materialized Views');
    call debug_msg(1, 'refresh_mv', CONCAT('Start Date: ', start_date));
    call debug_msg(1, 'refresh_mv', CONCAT('End Date: ', end_date));

    START TRANSACTION;

    #     delete from mat_view_regions where source_timestamp < NOW() - INTERVAL 1 YEAR;

#     SET @maxTimestamp = IFNULL((select max(source_timestamp) from mat_view_regions), NOW() - INTERVAL 20 YEAR);
    DELETE FROM mat_view_regions WHERE source_timestamp BETWEEN start_date and end_date;

    # UK Locations are buffered with a 0.01 degree buffer. At present this is not done on the world map
    # If the world map is supported then this may be required to capture location just outside of the strict
    # boundary supplied.
    INSERT INTO mat_view_regions
    SELECT t.source_id,
           t.source,
           t.hazard,
           t.source_timestamp,
           gr.region_type,
           gr.region,
           t.warning,
           IFNULL(t.deleted, false) as deleted,
           gr.map_location
    FROM live_text t,
         ref_geo_regions gr
    WHERE ST_Intersects(boundary, location)
      AND map_location <> 'uk'
      AND t.source_timestamp BETWEEN start_date and end_date;


    INSERT INTO mat_view_regions
    SELECT t.source_id,
           t.source,
           t.hazard,
           t.source_timestamp,
           gr.region_type,
           gr.region,
           t.warning,
           IFNULL(t.deleted, false) as deleted,
           gr.map_location
    FROM live_text t,
         ref_geo_regions gr
    WHERE ST_Intersects(buffered, location)
      AND map_location = 'uk'
      AND t.source_timestamp BETWEEN start_date and end_date;
    COMMIT;

    call debug_msg(1, 'refresh_mv', 'Updated mat_view_regions');

    START TRANSACTION;

#     SET @maxTimestampTSD = IFNULL((select max(source_date) from mat_view_timeseries_date), NOW() - INTERVAL 20 YEAR);
    DELETE FROM mat_view_timeseries_date WHERE source_date BETWEEN start_date and end_date;
    INSERT INTO mat_view_timeseries_date
    SELECT r.region                 as region_group_name,
           t.source                 as source,
           t.hazard                 as hazard,
           t.warning                as warning,
           t.source_date            as source_date,
           concat(md5(concat(r.source, ':', r.hazard, ':', r.region)), ' ',
                  t.source_text)    as source_text,
           r.region_type            as region_type,
           IFNULL(t.deleted, false) as deleted,
           t.source_id              as source_id,
           r.map_location
    FROM mat_view_regions r,
         live_text t
    WHERE t.source_id = r.source_id
      AND t.source = r.source
      AND t.hazard = r.hazard
      and not r.region REGEXP '^[0-9]+$'
      AND source_date BETWEEN start_date and end_date;
    COMMIT;
    call debug_msg(1, 'refresh_mv', 'Updated mat_view_timeseries_date');

    START TRANSACTION;

#     SET @maxTimestampTSH = IFNULL((select max(source_date) from mat_view_timeseries_hour), NOW() - INTERVAL 20 YEAR);
    DELETE FROM mat_view_timeseries_hour WHERE source_date BETWEEN start_date and end_date;
    INSERT INTO mat_view_timeseries_hour
    SELECT r.region                                                         as region_group_name,
           t.source                                                         as source,
           t.hazard                                                         as hazard,
           t.warning                                                        as warning,
           cast(date_format(t.source_timestamp, '%Y-%m-%d %H') as DATETIME) as source_date,
           concat(md5(concat(r.source, ':', r.hazard, ':', r.region)), ' ',
                  t.source_text)                                            as source_text,
           r.region_type                                                    as region_type,
           IFNULL(t.deleted, false)                                         as deleted,
           t.source_id                                                      as source_id,
           r.map_location
    FROM mat_view_regions r,
         live_text t
    WHERE t.source_id = r.source_id
      AND t.source = r.source
      AND t.hazard = r.hazard
      and not r.region REGEXP '^[0-9]+$'
      AND source_date BETWEEN start_date and end_date;
    COMMIT;
    call debug_msg(1, 'refresh_mv', 'Updated mat_view_timeseries_hour');


    SET rc = 0;
END;
$$

DELIMITER ;


DROP PROCEDURE IF EXISTS fill_days;

DELIMITER $$
CREATE PROCEDURE fill_days(start_date DATETIME, end_date DATETIME)

BEGIN
    SET start_date = cast(date_format(start_date, '%Y-%m-%d') as DATETIME);
    SET end_date = cast(date_format(end_date, '%Y-%m-%d') as DATETIME);
    call debug_msg(1, 'fill_days', CONCAT('Filling mat_view_days from ', start_date, ' to ', end_date));
    WHILE start_date <= end_date
        DO
            REPLACE INTO mat_view_days (date) VALUES (start_date);
            SET start_date = date_add(start_date, INTERVAL 1 DAY);
        END WHILE;
END;
$$

DROP PROCEDURE IF EXISTS fill_hours;

DELIMITER $$
CREATE PROCEDURE fill_hours(start_date DATETIME, end_date DATETIME)

BEGIN
    SET start_date = cast(date_format(start_date, '%Y-%m-%d %H') as DATETIME);
    SET end_date = cast(date_format(end_date, '%Y-%m-%d %H') as DATETIME);
    call debug_msg(1, 'fill_hours', CONCAT('Filling mat_view_hours from ', start_date, ' to ', end_date));
    WHILE start_date <= end_date
        DO
            REPLACE INTO mat_view_hours (date) VALUES (start_date);
            SET start_date = date_add(start_date, INTERVAL 1 HOUR);
        END WHILE;
END;
$$



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
