echo "//////////////////////////////////////////////////////////////////////"
echo "                   IMPORTING DEPUTIES DETAILS "
echo "//////////////////////////////////////////////////////////////////////"

# echo "Fetching data from www.quienmerepresenta.com"

# eval "node scripts/content/content-downloader.js from=1 to=300 content=deputy-details"
# eval "node scripts/content/content-downloader.js from=1 to=199 content=deputy-proportiona-details"

echo "Fetching profiles from sil.gobernacion.mx"
eval "node scripts/content/content-downloader.js from=1 to=101 content=profile"
eval "node scripts/content/content-downloader.js from=1 to=27 content=profile2"
