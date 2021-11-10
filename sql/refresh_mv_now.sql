# https://fromdual.com/mysql-materialized-views


# This will update the materialized view's last hour of data every 5 minutes. Effectively keeping the view 'live'
# Note that some Twitter retractions will be missed in this but caught in refresh_mv_map_window
DROP PROCEDURE IF EXISTS refresh_mv_now;
DELIMITER $$
CREATE PROCEDURE refresh_mv_now(
    OUT rc INT
)
BEGIN

    -- rollback transaction and bubble up errors if something bad happens
    DECLARE exit handler FOR SQLEXCEPTION, SQLWARNING
        BEGIN
            GET DIAGNOSTICS CONDITION 1
                @p1 = RETURNED_SQLSTATE, @p2 = MESSAGE_TEXT;
            ROLLBACK;
            set @rc = @p1;
            call debug_msg(-2, 'refresh_mv_now', concat('FAILED: ', @p1, ': ', @p2));
        END;
    call debug_msg(0, 'refresh_mv_now', 'Refreshing (Latest) Materialized Views');

    call refresh_mv(DATE_SUB(NOW(), INTERVAL 1 HOUR), NOW(), @rc);
    START TRANSACTION;
    call fill_hours(DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_ADD(NOW(), INTERVAL 1 HOUR));
    call debug_msg(0, 'refresh_mv', 'Updated mat_view_hours');
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


    -- rollback transaction and bubble up errors if something bad happens
    DECLARE exit handler FOR SQLEXCEPTION, SQLWARNING
        BEGIN
            GET DIAGNOSTICS CONDITION 1
                @p1 = RETURNED_SQLSTATE, @p2 = MESSAGE_TEXT;
            ALTER EVENT mv_latest_refresh_event
                ENABLE;
            ROLLBACK;
            set @rc = @p1;
            call debug_msg(-2, 'refresh_mv_map_window', concat('FAILED: ', @p1, ': ', @p2));
        END;
    ALTER EVENT mv_latest_refresh_event
        DISABLE;
    call debug_msg(0, 'refresh_mv_map_window', 'Refreshing (Window Duration) Materialized Views');

    call refresh_mv(DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY), @rc);

    START TRANSACTION;
    call fill_days(DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY));
    call update_text_count(DATE_SUB(CURDATE(), INTERVAL 4 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY));
    call debug_msg(0, 'refresh_mv', 'Updated mat_view_days');
    COMMIT;
    ALTER EVENT mv_latest_refresh_event
        ENABLE;
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
    -- rollback transaction and bubble up errors if something bad happens
    DECLARE exit handler FOR SQLEXCEPTION, SQLWARNING
        BEGIN
            GET DIAGNOSTICS CONDITION 1
                @p1 = RETURNED_SQLSTATE, @p2 = MESSAGE_TEXT;
            ALTER EVENT mv_latest_refresh_event
                ENABLE;
            ALTER EVENT mv_map_window_refresh_event
                ENABLE;
            ROLLBACK;
            set @rc = @p1;
            call debug_msg(-2, 'refresh_mv_full', concat('FAILED: ', @p1, ': ', @p2));
        END;

    call debug_msg(0, 'refresh_mv_full', 'Refreshing (Full) Materialized Views');
    ALTER EVENT mv_latest_refresh_event
        DISABLE;
    ALTER EVENT mv_map_window_refresh_event
        DISABLE;

    START TRANSACTION;

    call debug_msg(1, 'refresh_mv_full', 'Refreshing map criteria.');

    # noinspection SqlWithoutWhere
    delete from mat_view_map_criteria;
    insert into mat_view_map_criteria
    SELECT distinct region,
                    region_type,
                    hazard,
                    source,
                    warning,
                    deleted,
                    map_location
    FROM mat_view_regions;
    call debug_msg(1, 'refresh_mv_full', 'Refreshed map criteria.');
    COMMIT;

    WHILE dt <= NOW()
        DO
            call debug_msg(1, 'refresh_mv_full', CONCAT('Refreshing month starting ', dt));
            CALL refresh_mv(dt, DATE_ADD(dt, INTERVAL 1 MONTH), @rc);
            call debug_msg(1, 'refresh_mv_full', CONCAT('Updating text count for month starting ', dt));
            CALL update_text_count(dt, DATE_ADD(dt, INTERVAL 1 MONTH));
            call debug_msg(1, 'refresh_mv_full', CONCAT('Filling days for month starting ', dt));
            CALL fill_days(dt, DATE_ADD(dt, INTERVAL 1 MONTH));
            call debug_msg(1, 'refresh_mv_full', CONCAT('Filling hours for month starting ', dt));
            CALL fill_hours(dt, DATE_ADD(dt, INTERVAL 1 MONTH));
            CALL refresh_mv_now(@rc);
            SET dt = DATE_ADD(dt, INTERVAL 1 MONTH);
        END WHILE;

    START TRANSACTION;

    call debug_msg(1, 'refresh_mv_full', 'Refreshing first entries.');

    REPLACE INTO mat_view_first_entries
    SELECT min(source_timestamp) as source_timestamp, hazard, source
    FROM mat_view_regions
    GROUP BY hazard, source;
    call debug_msg(1, 'refresh_mv_full', 'Refreshed first entries.');
    COMMIT;

    START TRANSACTION;
    call debug_msg(1, 'refresh_mv_full', 'Refreshing data day counts.');
    replace into mat_view_data_days
    select count(*) as days, region, region_type, hazard, source, warning
    from mat_view_text_count tc
    group by region, region_type, hazard, source, warning;
    call debug_msg(1, 'refresh_mv_full', 'Refreshed data day counts.');
    COMMIT;

    ALTER EVENT mv_latest_refresh_event
        ENABLE;
    ALTER EVENT mv_map_window_refresh_event
        ENABLE;


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
            GET DIAGNOSTICS CONDITION 1
                @p1 = RETURNED_SQLSTATE, @p2 = MESSAGE_TEXT;
            ROLLBACK;
            set @rc = @p1;
            call debug_msg(-2, 'refresh_mv', concat('FAILED: ', @p1, ': ', @p2));
        END;
    call debug_msg(0, 'refresh_mv', 'Refreshing Materialized Views');
    call debug_msg(1, 'refresh_mv', CONCAT('Start Date: ', start_date));
    call debug_msg(1, 'refresh_mv', CONCAT('End Date: ', end_date));

    START TRANSACTION;

    #     delete from mat_view_regions where source_timestamp < NOW() - INTERVAL 1 YEAR;

#     SET @maxTimestamp = IFNULL((select max(source_timestamp) from mat_view_regions), NOW() - INTERVAL 20 YEAR);
    DELETE FROM mat_view_regions WHERE source_timestamp BETWEEN start_date and end_date;

    INSERT INTO mat_view_regions
    SELECT t.source_id,
           t.source,
           t.hazard,
           t.source_timestamp          source_timestamp,
           gr.region_type,
           gr.region,
           t.warning,
           IFNULL(t.deleted, false) as deleted,
           gr.map_location
    FROM live_text t,
         ref_geo_regions gr
    WHERE ST_Intersects(boundary, location)
      AND t.source_timestamp BETWEEN start_date and end_date;
    COMMIT;


    call debug_msg(1, 'refresh_mv', 'Updated mat_view_text_count');
    #
#     # UK Locations are buffered with a 0.01 degree buffer. At present this is not done on the world map
#     # If the world map is supported then this may be required to capture location just outside of the strict
#     # boundary supplied. We only use the buffered values when the non buffered regions do not match.
#     INSERT INTO mat_view_regions
#     SELECT t.source_id,
#            t.source,
#            t.hazard,
#            t.source_timestamp,
#            gr.region_type,
#            gr.region,
#            t.warning,
#            IFNULL(t.deleted, false) as deleted,
#            gr.map_location
#     FROM live_text t,
#          ref_geo_regions gr
#     WHERE ST_Intersects(buffered, location)
#       AND map_location = 'uk'
#       AND (select count(*) from ref_geo_regions where st_intersects(boundary, t.location) and map_location = 'uk') = 0
#       AND t.source_timestamp BETWEEN start_date and end_date;
#     COMMIT;

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
      AND cast(date_format(t.source_timestamp, '%Y-%m-%d %H') as DATETIME) BETWEEN start_date and end_date;
    COMMIT;
    call debug_msg(1, 'refresh_mv', 'Updated mat_view_timeseries_hour');


    START TRANSACTION;
    call debug_msg(1, 'refresh_mv', 'Fixing XY swapped data');
    #This swaps XY on broken UK data, this is a temporary solution and should be removed.
    UPDATE live_text
    SET location = st_swapxy(location)
    WHERE NOT st_contains(ST_GeomFromText('POLYGON((65 -15, 40 -15, 40 5, 65 5, 65 -15))', 4326), location)
      AND source_date BETWEEN start_date and end_date;
    call debug_msg(1, 'refresh_mv', 'Fixed XY swapped data');
    COMMIT;

    call debug_msg(0, 'refresh_mv', 'SUCCESS');


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

DROP PROCEDURE IF EXISTS update_text_count;

DELIMITER $$
CREATE PROCEDURE update_text_count(start_date DATE, end_date DATE)

BEGIN
    call debug_msg(0, 'update_text_count', CONCAT('Updating mat_view_text_count from ', start_date, ' to ', end_date));
    START TRANSACTION;
    DELETE FROM mat_view_text_count WHERE source_date BETWEEN start_date and end_date;

    # This zeros out all daily counts for ALL the days in the range. So that when the actual values are
    # placed in the table, any missing days (i.e. with no data) still get these zero values.
    INSERT INTO mat_view_text_count
    SELECT distinct 0    as text_count,
                    t.source,
                    t.hazard,
                    date as source_date,
                    t.region_type,
                    t.region,
                    t.warning,
                    t.deleted,
                    t.map_location
    FROM mat_view_map_criteria t,
         (select date from mat_view_days where date BETWEEN start_date and end_date) days;

    #Now replace all non-zero days.
    REPLACE INTO mat_view_text_count
    SELECT count(t.source)                                               as text_count,
           t.source,
           t.hazard,
           cast(date_format(t.source_timestamp, '%Y-%m-%d') as DATETIME) as source_date,
           t.region_type,
           t.region,
           t.warning,
           t.deleted,
           t.map_location
    FROM mat_view_regions t
    WHERE t.source_timestamp BETWEEN start_date and end_date
    GROUP BY region, region_type, hazard, source, t.map_location, warning, deleted, source_date;
    COMMIT;
    call debug_msg(0, 'update_text_count', CONCAT('Updated mat_view_text_count from ', start_date, ' to ', end_date));

END;
$$



DROP PROCEDURE IF EXISTS daily_housekeeping;

DELIMITER $$
CREATE PROCEDURE daily_housekeeping(OUT rc INT)

BEGIN
    -- rollback transaction and bubble up errors if something bad happens
    DECLARE exit handler FOR SQLEXCEPTION, SQLWARNING
        BEGIN
            GET DIAGNOSTICS CONDITION 1
                @p1 = RETURNED_SQLSTATE, @p2 = MESSAGE_TEXT;
            ROLLBACK;
            set @rc = @p1;
            call debug_msg(-2, 'daily_housekeeping', concat('FAILED: ', @p1, ': ', @p2));
        END;

    call debug_msg(0, 'daily_housekeeping', 'Optimizing tables');

    optimize table live_text;
    optimize table mat_view_regions;
    optimize table mat_view_timeseries_date;
    optimize table mat_view_timeseries_hour;
    optimize table mat_view_first_entries;
    optimize table mat_view_text_count;
    call debug_msg(0, 'daily_housekeeping', 'Optimized tables');
    set @rc = 0;

END;
$$


DROP EVENT IF EXISTS daily_housekeeping_event;
CREATE EVENT daily_housekeeping_event
    ON SCHEDULE EVERY 1 DAY
        STARTS '2021-01-01 20:17:17'
    DO CALL daily_housekeeping(@rc);

DROP EVENT IF EXISTS mv_full_refresh_event;
CREATE EVENT mv_full_refresh_event
    ON SCHEDULE EVERY 1 DAY
        STARTS '2021-01-01 22:19:19'
    DO CALL refresh_mv_full(@rc);

DROP EVENT IF EXISTS mv_map_window_refresh_event;
CREATE EVENT mv_map_window_refresh_event
    ON SCHEDULE EVERY 79 MINUTE
        STARTS '2021-01-01 00:23:23'
    DO CALL refresh_mv_map_window(@rc);

DROP EVENT IF EXISTS mv_latest_refresh_event;
CREATE EVENT mv_latest_refresh_event
    ON SCHEDULE EVERY 7 MINUTE
        STARTS '2021-01-01 00:00:00'
    DO CALL refresh_mv_now(@rc);
