echo "//////////////////////////////////////////////////////////////////////"
echo "                   IMPORTING DEPUTIES "
echo "//////////////////////////////////////////////////////////////////////"

for i in `seq 1 20`;
do
  echo ">> Importing batch $(($i))"
  eval "node scripts/scrape-deputies.js from=$((($i - 1) * 50 + 1)) to=$(($i * 50 ))"
done

eval "node scripts/scrape-deputies.js from=1001 to=1001"
eval "node scripts/scrape-deputies.js from=1003 to=1003"
