echo "//////////////////////////////////////////////////////////////////////"
echo "                   IMPORTING DEPUTIES "
echo "//////////////////////////////////////////////////////////////////////"
eval "mkdir -p data/storage"

echo ">> Downloading pictures"
eval "node scripts/deputy-pictures.js"
echo ">> Optimizing pictures"
eval "node scripts/optimize-pictures.js"

eval "tar -cvzf data/storage.tar.gz data/storage"
