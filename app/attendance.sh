echo "//////////////////////////////////////////////////////////////////////"
echo "                   IMPORTING ATTENDANCE "
echo "//////////////////////////////////////////////////////////////////////"

for i in `seq 1 100`;
do
  echo ">> Importing batch $(($i))"
  eval "node scripts/scrape-attendance.js from=$((($i - 1) * 10 + 1)) to=$(($i * 10 ))"
done

eval "node scripts/scrape-attendance.js from=1001 to=1001"
eval "node scripts/scrape-attendance.js from=1003 to=1003"

eval "mkdir -p data/sql"
echo ">> Calculating attendance summary"
eval "node scripts/deputy-attendance-summary.js"

echo ">> Merge data"
eval "mysql --host mysql -pcamara -u camara -D camara < data/sql/deputy-attendance-summary.sql"
eval "mysql --host mysql -pcamara -u camara -D camara < scripts/sql/insert-missing-attendance.sql"
