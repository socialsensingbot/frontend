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
    SELECT t.source_id, t.source, t.hazard, t.source_timestamp, tr.region_type, tr.region, t.warning
    FROM live_text t,
         live_text_regions tr
    where tr.source_id = t.source_id
      and tr.source = t.source
      and tr.hazard = t.hazard
      and NOT deleted
    ORDER BY source_timestamp DESC;
    COMMIT;

    SET rc = 0;
END;
$$

DELIMITER ;
