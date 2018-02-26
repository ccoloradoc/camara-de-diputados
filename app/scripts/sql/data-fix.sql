-- Deputies with active alternates from different party
-- select a.id, count(1) from (
-- 	select s.id, s.type, d.party, count(1) as quantity
-- 	from Seats s join Deputies d on s.id = d.SeatId join Attendances a on a.DeputyId = d.id
-- 	where a.attendance in ('A', 'AO', 'PM', 'IV')
-- 	group by s.id, s.type, d.party
-- ) a group by a.id
-- having count(1) > 1;

-- select * from Deputies where SeatId in (21, 417);
--
update Deputies set party ='pve' where id = 521;
update Deputies set party ='prd' where id = 917;

-- select concat('update Deputies set facebook=\'https://', facebook, '\' where id =', id, ';') from Deputies
-- where facebook not like '%https://%' and facebook not like 'NA'
-- union
-- select concat('update Deputies set twitter=\'https://', twitter, '\' where id =', id, ';') from Deputies
-- where twitter not like '%https://%' and twitter not like 'NA';


update Deputies set facebook='https://www.facebook.com/RafaelHSoriano' where id =56;
update Deputies set facebook='https://http://www.facebook.com/ToroGrappin' where id =256;
update Deputies set facebook='https://www.facebook.com/lialimong' where id =444;
update Deputies set twitter='https://twitter.com/carreraleti' where id =67;
update Deputies set twitter='https://www.twitter.com/CynthiaG_MC' where id =329;
