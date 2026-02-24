#!/bin/bash

URL=$1
TIMESTAMP=$(date +%s)
OUTPUT_DIR="." # Current directory
OUTPUT_FILE="${OUTPUT_DIR}/lighthouse_report_${TIMESTAMP}.json"

if [ -z "$URL" ]; then
  echo "Usage: $0 <URL>"
  exit 1
fi

echo "Running Lighthouse audit for: $URL"
echo "Saving report to: $OUTPUT_FILE"

lighthouse "$URL" --output=json --output-path="$OUTPUT_FILE" --quiet

if [ $? -eq 0 ]; then
  echo "Lighthouse audit completed successfully."
  echo "Report saved to: $OUTPUT_FILE"
else
  echo "Lighthouse audit failed."
  exit 1
fi
