-- Current script identify the missing attendance registered and insert a dummy
drop table if exists stg_seat_attendance;

create table stg_seat_attendance (
	SeatId INTEGER,
    SessionId INTEGER,
    attendanceDate datetime,
    INDEX stg_attendance_index (SeatId, SessionId, attendanceDate)
);

-- insert into stg 16s
insert into stg_seat_attendance
select distinct s.id as SeatId, a.SessionId, a.attendanceDate
from Seats s join ( select distinct SessionId, attendanceDate from Attendances) a;

-- select * from stg_seat_attendance where SeatId = 1;

insert ignore into Attendances (SeatId, SessionId, attendance, description, attendanceDate, createdAt, updatedAt, DeputyId)
select sa.SeatId, sa.SessionId, 'NA', 'No Registrada', sa.attendanceDate, now(), now(),
SUBSTRING_INDEX(GROUP_CONCAT(CAST(d.id AS CHAR) ORDER BY d.id asc), ',', 1 ) as DeputyId
from stg_seat_attendance sa join Deputies d on sa.SeatId = d.SeatId
    left outer join Attendances a on sa.SeatId = a.SeatId and sa.attendanceDate = a.attendanceDate
where a.attendanceDate is null
group by sa.SeatId, sa.SessionId, 'NA', 'No Registrada', sa.attendanceDate, now(), now();



drop table if exists stg_seat_attendance;
