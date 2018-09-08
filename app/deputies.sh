echo "//////////////////////////////////////////////////////////////////////"
echo "                   IMPORTING DEPUTIES "
echo "//////////////////////////////////////////////////////////////////////"
eval "mkdir -p data/storage"
eval "mkdir -p data/sql"

for i in `seq 1 20`;
do
  echo ">> Importing batch $(($i))"
  eval "node scripts/scrape-deputies.js from=$((($i - 1) * 50 + 1)) to=$(($i * 50 ))"
done

eval "node scripts/scrape-deputies.js from=1001 to=1001"
eval "node scripts/scrape-deputies.js from=1003 to=1003"

# echo ">> Scraping quienmerepresenta"
#
# eval "node scripts/scrape-deputies-details.js from=1 to=199"
# eval "node scripts/scrape-proportional-deputies-details.js from=1 to=300"
#
# echo ">> Merging data"
#
# eval "mysql --host mysql -pcamara -u camara -D camara < data/sql/deputy-contact.sql"
# eval "mysql --host mysql -pcamara -u camara -D camara < data/sql/deputy-proportional-contact.sql"
# eval "mysql --host mysql -pcamara -u camara -D camara < scripts/sql/data-fix.sql"
