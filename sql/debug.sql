DROP PROCEDURE IF EXISTS debug_msg;
DELIMITER $$

CREATE PROCEDURE debug_msg(level int, source varchar(32), message TEXT)
BEGIN
    INSERT INTO internal_debug (time, level, message, source) VALUES (NOW(), level, message, source);
END $$
