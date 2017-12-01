default: all

all: mapping deputies attendance initiatives votes extract

mapping:
	./mapping.sh

deputies:
	./deputies.sh

attendance:
	./attendance.sh

initiatives: 
	./initiatives.sh

votes: deputies
	./votes.sh

extract: mapping deputies attendance initiatives votes
	./extract.sh
