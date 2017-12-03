eval mkdir -p ./data/pdf
eval mkdir -p ./data/log
eval node scripts/scrape-attendance-pdf.js
eval node scripts/download-attendance-pdf.js
for i in `seq 1 37`;
do
  echo ">> Importing batch $(($i))"
  eval node scripts/process-attendance-pdf.js
done
