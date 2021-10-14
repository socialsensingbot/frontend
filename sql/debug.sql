DROP PROCEDURE IF EXISTS debug_msg;
DELIMITER $$

CREATE PROCEDURE debug_msg(msg VARCHAR(255))
BEGIN
    IF (select boolean_value from ref_key_value where k = 'debug') THEN
        select concat('** ', msg) AS '** DEBUG:';
    END IF;
END $$
