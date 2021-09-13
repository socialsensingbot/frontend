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
    SELECT t.source_id, t.source, t.hazard, source_timestamp, region_type, region, warning
    FROM live_text t
             left join
         live_text_regions tr on tr.source_id = t.source_id and tr.source = t.source and tr.hazard = t.hazard
    WHERE source_timestamp >= @maxTimestamp
      AND NOT deleted;
    COMMIT;

    SET rc = 0;
END;
$$

DELIMITER ;
