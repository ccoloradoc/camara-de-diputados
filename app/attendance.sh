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
