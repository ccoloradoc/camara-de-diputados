echo "//////////////////////////////////////////////////////////////////////"
echo "                   EXTRACTING DUMP "
echo "//////////////////////////////////////////////////////////////////////"

eval mkdir -p data/dump
eval mysqldump --host mysql -P 3306 -u camara -pcamara camara > data/dump/camara.sql
eval tar -cvzf data/dump.tar.gz data/dump
