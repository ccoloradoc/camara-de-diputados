echo "//////////////////////////////////////////////////////////////////////"
echo "                   IMPORTING DEPUTIES "
echo "//////////////////////////////////////////////////////////////////////"
eval "mkdir -p data/scraper"

for i in `seq 1 20`;
do
  echo ">> Importing batch $(($i))"
  eval "node scripts/content/content-downloader.js from=$((($i - 1) * 50 + 1)) to=$(($i * 50 )) content=deputy"
done

eval "node scripts/content/content-downloader.js from=1001 to=1001 content=deputy"
eval "node scripts/content/content-downloader.js from=1003 to=1003 content=deputy"
eval "node scripts/content/content-downloader.js from=1005 to=1005 content=deputy"
