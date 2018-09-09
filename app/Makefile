default: beatrix

all: log mapping deputies attendance initiatives votes extract

cache: cache-deputies cache-deputy-details cache-attendance

beatrix: log mapping deputies deputies-profile deputies-social deputies-pictures attendance

log:
	mkdir -p ./data/log

cache-deputies:
	./cache-deputies.sh 2>&1 | tee ./data/log/cache-deputies.log

cache-deputy-details:
	./cache-deputy-details.sh 2>&1 | tee ./data/log/cache-deputy-details.log

cache-attendance:
	./cache-attendance.sh 2>&1 | tee ./data/log/cache-attendance.log

mapping: log
	./mapping.sh 2>&1 | tee ./data/log/mapping.log

deputies: log
	./deputies.sh 2>&1 | tee ./data/log/deputies.log

deputies-profile:
	./deputies-profile.sh 2>&1 | tee ./data/log/deputies-profile.log

deputies-social:
	./deputies-social.sh 2>&1 | tee ./data/log/deputies-social.log

deputies-pictures:
	./deputies-pictures.sh 2>&1 | tee ./data/log/deputies-pictures.log

attendance: log
	./attendance.sh 2>&1 | tee ./data/log/attendance.log

initiatives: log
	./initiatives.sh 2>&1 | tee ./data/log/initiatives.log

votes: log
	./votes.sh 2>&1 | tee ./data/log/votes.log

extract: log
	./extract.sh 2>&1 | tee ./data/log/extract.log
