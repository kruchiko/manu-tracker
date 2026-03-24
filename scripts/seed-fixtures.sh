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

echo "==> Setting max duration threshold to 1 minute..."
curl -sf -X PATCH "$BASE_URL/stations/$STATION_ID" \
  -H 'Content-Type: application/json' \
  -d '{"maxDurationSeconds":60}' > /dev/null
echo "    Threshold set."

echo "==> Creating order for Acme Corp..."
ORDER=$(curl -sf -X POST "$BASE_URL/orders" \
  -H 'Content-Type: application/json' \
  -d '{"customerName":"Acme Corp","productType":"Widget A","quantity":1}')

ORDER_ID=$(echo "$ORDER" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
TRAY_CODE=$(echo "$ORDER" | python3 -c "import sys,json; print(json.load(sys.stdin)['trayCode'])")
echo "    Order created: id=$ORDER_ID trayCode=$TRAY_CODE"

echo "==> Downloading QR code..."
QR_PATH="scripts/qr-${TRAY_CODE}.png"
curl -sf "$BASE_URL/orders/$ORDER_ID/qr" -o "$QR_PATH"
echo "    QR saved to $QR_PATH"

echo ""
echo "Done! Print $QR_PATH and place it under the camera."
