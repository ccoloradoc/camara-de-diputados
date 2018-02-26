-- Current script gather all tentative attendance all deputies should have
-- Then gather real attendances registered in portal
-- Finally it generates a record for missing attendance for insertion under NA

-- Create STG table
drop table if exists stg_seat_attendance;

create table stg_seat_attendance (
	SeatId INTEGER,
    SessionId INTEGER,
    attendanceDate datetime,
    INDEX name (SeatId,attendanceDate)
);

-- insert into stg 16s
insert into stg_seat_attendance
select s.id, a.SessionId, a.attendanceDate
from Seats s join Attendances a group by s.id, a.attendanceDate, a.SessionId;

-- select SeatId, count(1) from stg_seat_attendance group by SeatId;

drop table if exists stg_deputy_attendance;

create table stg_deputy_attendance (
	SeatId integer,
    attendanceDate datetime,
    deputies varchar(255),
    INDEX name (SeatId,attendanceDate)
);

-- Inserting current attendances 1.5s
insert into stg_deputy_attendance
select s.id, a.attendanceDate, GROUP_CONCAT(d.id SEPARATOR ',') deputies
from Seats s join Deputies d on s.id = d.SeatId join Attendances a on d.id = a.DeputyId
group by s.id, a.attendanceDate
order by s.id;

-- select SeatId, count(1) from stg_deputy_attendance group by SeatId having count(1) < 132;

-- .2s = 570
select sa.SeatId, sa.SessionId, sa.attendanceDate
from stg_seat_attendance sa
	left outer join stg_deputy_attendance da on da.SeatId = sa.SeatId and da.attendanceDate = sa.attendanceDate
where da.SeatId is null
group by sa.SeatId, sa.SessionId, sa.attendanceDate
order by sa.SeatId, sa.SessionId, sa.attendanceDate;
--


-- inserting missing attendances (570)
insert into Attendances (attendance, description, attendanceDate, SessionId, DeputyId, createdAt, updatedAt)
select 'NA' as attendance, 'No registrada', sa.attendanceDate, sa.SessionId, d.id as DeputyId, now(), now()
from stg_seat_attendance sa
	join Deputies d on sa.SeatId = d.SeatId and (d.id < 500 or d.id in (1001, 1003) )
	left outer join stg_deputy_attendance da on da.SeatId = sa.SeatId and da.attendanceDate = sa.attendanceDate
where da.SeatId is null
order by sa.SeatId, sa.SessionId, sa.attendanceDate;

drop table if exists stg_seat_attendance;
drop table if exists stg_deputy_attendance;
