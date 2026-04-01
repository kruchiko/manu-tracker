#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BACKEND_URL:-http://localhost:3000}"

echo "==> Creating station 'Station One' in Green Room..."
STATION=$(curl -sf -X POST "$BASE_URL/stations" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Station One","location":"Green Room"}')

STATION_ID=$(echo "$STATION" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "    Station created: $STATION_ID"

echo "==> Assigning eye-1 to $STATION_ID..."
curl -sf -X PUT "$BASE_URL/stations/$STATION_ID/eye" \
  -H 'Content-Type: application/json' \
  -d '{"eyeId":"eye-1"}' > /dev/null
echo "    Eye assigned."

echo "==> Creating pipeline 'Standard Flow'..."
PIPELINE=$(curl -sf -X POST "$BASE_URL/pipelines" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Standard Flow\",\"description\":\"Default processing pipeline\",\"steps\":[{\"stationId\":\"$STATION_ID\",\"maxDurationSeconds\":60}]}")

PIPELINE_ID=$(echo "$PIPELINE" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "    Pipeline created: $PIPELINE_ID"

echo "==> Creating job for Widget A..."
JOB=$(curl -sf -X POST "$BASE_URL/jobs" \
  -H 'Content-Type: application/json' \
  -d "{\"productType\":\"Widget A\",\"quantity\":1,\"pipelineId\":\"$PIPELINE_ID\"}")

JOB_ID=$(echo "$JOB" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
TRAY_CODE=$(echo "$JOB" | python3 -c "import sys,json; print(json.load(sys.stdin)['trayCode'])")
echo "    Job created: id=$JOB_ID trayCode=$TRAY_CODE"

echo "==> Downloading QR code..."
QR_PATH="scripts/qr-${TRAY_CODE}.png"
curl -sf "$BASE_URL/jobs/$JOB_ID/qr" -o "$QR_PATH"
echo "    QR saved to $QR_PATH"

echo ""
echo "Done! Print $QR_PATH and place it under the camera."
