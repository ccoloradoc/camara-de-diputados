DROP PROCEDURE IF EXISTS merge_social_profile;

DELIMITER $$

CREATE PROCEDURE merge_social_profile ()
BEGIN

 DECLARE v_finished INTEGER DEFAULT 0;
 DECLARE v_ref varchar(255);
 DECLARE v_portal varchar(255);
 DECLARE v_id integer;

 -- declare cursor for employee email
 DEClARE social_cursor CURSOR FOR
 select d.id, ps.ref, ps.portal
 from Deputies d join ProfileSocial ps on d.slug = ps.slug and ps.portal = 'facebook'
 union
 select d.id, ps.ref, ps.portal
 from Deputies d join ProfileSocial ps on d.slug = ps.slug and ps.portal = 'twitter';


 -- declare NOT FOUND handler
 DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_finished = 1;

 OPEN social_cursor;
 social_loop: LOOP
 FETCH social_cursor INTO v_id, v_ref, v_portal;

 IF v_finished = 1 THEN
 LEAVE social_loop;
 END IF;

 -- build email list
IF v_portal = 'facebook' THEN
	update Profiles set facebook = v_ref where id = v_id;
ELSE
	update Profiles set twitter = v_ref where id = v_id;
END IF;

 END LOOP social_loop;

 CLOSE social_cursor;

END$$

DELIMITER ;

call merge_social_profile();

-- select  * from Profiles where facebook is not null or twitter is not null;
-- update Profiles set facebook = null, twitter = null where 1 = 1;
