echo "//////////////////////////////////////////////////////////////////////"
echo "                   IMPORTING DEPUTIES "
echo "//////////////////////////////////////////////////////////////////////"

echo "Scraping profiles"
eval "node scripts/scrape-deputies-profile.js"

echo "Merging profiles"
eval "mysql --host mysql -pcamara -u camara -D camara < scripts/sql/merge-profile.sql"
