default: all

all: log mapping deputies attendance initiatives votes extract

log:
	mkdir -p ./data/log

mapping: log
	./mapping.sh 2>&1 | tee ./data/log/mapping.log

deputies: log
	./deputies.sh 2>&1 | tee ./data/log/deputies.log

attendance: log
	./attendance.sh 2>&1 | tee ./data/log/attendance.log

initiatives: log
	./initiatives.sh 2>&1 | tee ./data/log/initiatives.log

votes: log
	./votes.sh 2>&1 | tee ./data/log/votes.log

extract: log
	./extract.sh 2>&1 | tee ./data/log/extract.log

attendanceFiles: log
	./attendance-files.sh 2>&1 | tee ./data/log/attendance-files.log
