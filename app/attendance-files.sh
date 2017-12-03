eval mkdir -p ./data/pdf
eval mkdir -p ./data/log
eval node scripts/scrape-attendance-pdf.js
eval node scripts/download-attendance-pdf.js
eval node scripts/process-attendance-pdf.js
