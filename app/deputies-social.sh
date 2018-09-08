echo "//////////////////////////////////////////////////////////////////////"
echo "                   IMPORTING DEPUTIES "
echo "//////////////////////////////////////////////////////////////////////"

echo "Importing social profiles"
eval "mysql --host mysql -pcamara -u camara -D camara < scripts/sql/import-social-profile.sql"
eval "mysql --host mysql -pcamara -u camara -D camara < scripts/sql/merge-social-profile.sql"
