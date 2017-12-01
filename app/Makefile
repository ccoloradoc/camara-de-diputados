default: all

all: log mapping deputies attendance initiatives votes extract

log:
	mkdir -p log

mapping: log
	./mapping.sh 2>&1 | tee log/mapping.log

deputies: log
	./deputies.sh 2>&1 | tee log/deputies.log

attendance: log
	./attendance.sh 2>&1 | tee log/attendance.log

initiatives: log
	./initiatives.sh 2>&1 | tee log/initiatives.log

votes: log
	./votes.sh 2>&1 | tee log/votes.log

extract: log
	./extract.sh 2>&1 | tee log/extract.log
