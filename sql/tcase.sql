DELIMITER |
CREATE FUNCTION replaceword(str VARCHAR(128), word VARCHAR(128))
    RETURNS VARCHAR(128)
    DETERMINISTIC
BEGIN
    DECLARE loc INT;
    DECLARE punct CHAR(27) DEFAULT ' ()[]{},.-_!@;:?/''"#$%^&*<>';
    DECLARE lowerWord VARCHAR(128);
    DECLARE lowerStr VARCHAR(128);

    IF LENGTH(word) = 0 THEN
        RETURN str;
    END IF;
    SET lowerWord = LOWER(word);
    SET lowerStr = LOWER(str);
    SET loc = LOCATE(lowerWord, lowerStr, 1);
    WHILE loc > 0
        DO
            IF loc = 1 OR LOCATE(SUBSTRING(str, loc - 1, 1), punct) > 0 THEN
                IF loc + LENGTH(word) > LENGTH(str) OR LOCATE(SUBSTRING(str, loc + LENGTH(word), 1), punct) > 0 THEN
                    SET str = INSERT(str, loc, LENGTH(word), word);
                END IF;
            END IF;
            SET loc = LOCATE(lowerWord, lowerStr, loc + LENGTH(word));
        END WHILE;
    RETURN str;
END;
|
DELIMITER ;

DELIMITER |
CREATE FUNCTION tcase(str VARCHAR(128))
    RETURNS VARCHAR(128)
    DETERMINISTIC
BEGIN
    DECLARE c CHAR(1);
    DECLARE s VARCHAR(128);
    DECLARE i INT DEFAULT 1;
    DECLARE bool INT DEFAULT 1;
    DECLARE punct CHAR(27) DEFAULT ' ()[]{},.-_!@;:?/''"#$%^&*<>';

    SET s = LCASE(str);
    WHILE i <= LENGTH(str)
        DO
            BEGIN
                SET c = SUBSTRING(s, i, 1);
                IF LOCATE(c, punct) > 0 THEN
                    SET bool = 1;
                ELSEIF bool = 1 THEN
                    BEGIN
                        IF c >= 'a' AND c <= 'z' THEN
                            BEGIN
                                SET s = CONCAT(LEFT(s, i - 1), UCASE(c), SUBSTRING(s, i + 1));
                                SET bool = 0;
                            END;
                        ELSEIF c >= '0' AND c <= '9' THEN
                            SET bool = 0;
                        END IF;
                    END;
                END IF;
                SET i = i + 1;
            END;
        END WHILE;

    SET s = replaceword(s, 'a');
    SET s = replaceword(s, 'an');
    SET s = replaceword(s, 'and');
    SET s = replaceword(s, 'as');
    SET s = replaceword(s, 'at');
    SET s = replaceword(s, 'but');
    SET s = replaceword(s, 'by');
    SET s = replaceword(s, 'for');
    SET s = replaceword(s, 'if');
    SET s = replaceword(s, 'in');
    SET s = replaceword(s, 'n');
    SET s = replaceword(s, 'of');
    SET s = replaceword(s, 'on');
    SET s = replaceword(s, 'or');
    SET s = replaceword(s, 'the');
    SET s = replaceword(s, 'to');
    SET s = replaceword(s, 'via');

    SET s = replaceword(s, 'RSS');
    SET s = replaceword(s, 'URL');
    SET s = replaceword(s, 'PHP');
    SET s = replaceword(s, 'SQL');
    SET s = replaceword(s, 'OPML');
    SET s = replaceword(s, 'DHTML');
    SET s = replaceword(s, 'CSV');
    SET s = replaceword(s, 'iCal');
    SET s = replaceword(s, 'XML');
    SET s = replaceword(s, 'PDF');

    SET c = SUBSTRING(s, 1, 1);
    IF c >= 'a' AND c <= 'z' THEN
        SET s = CONCAT(UCASE(c), SUBSTRING(s, 2));
    END IF;

    RETURN s;
END;
|
DELIMITER ;
