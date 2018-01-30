echo "//////////////////////////////////////////////////////////////////////"
echo "                   IMPORTING DEPUTIES "
echo "//////////////////////////////////////////////////////////////////////"

for i in `seq 1 30`;
do
  echo ">> Importing batch $(($i))"
  eval "node scripts/scrape-deputies-details.js from=$((($i - 1) * 10 + 1)) to=$(($i * 10 ))"
done

for i in `seq 1 20`;
do
  echo ">> Importing batch $(($i))"
  eval "node scripts/scrape-deputies-details.js from=$((($i - 1) * 10 + 1)) to=$(($i * 10 ))"
done
