# manu-eye

Camera station service — reads QR codes from a USB webcam and sends **presence** tracking events to the manu-gen backend (`arrived` when a tray becomes stably visible, `departed` when it is stably gone). While a tray stays under the camera, **no** events are sent.

## Quick start

```bash
# Install dependencies (pyzbar requires the zbar system library)
# macOS:  brew install zbar
# Ubuntu: sudo apt-get install libzbar0
uv sync

# Set required env vars (or create .env file)
export EYE_ID=eye-1
export BACKEND_URL=http://localhost:3000

# macOS only — pyzbar needs to find the zbar dylib
export DYLD_LIBRARY_PATH=/opt/homebrew/lib

# Run
uv run python -m src.main
```

## Configuration

| Variable                    | Default                 | Description |
| --------------------------- | ----------------------- | ----------- |
| `EYE_ID`                    | (required)              | Unique ID for this eye device |
| `BACKEND_URL`               | `http://localhost:3000` | manu-gen backend base URL |
| `CAMERA_INDEX`              | `0`                     | OpenCV camera device index |
| `FRAME_INTERVAL_MS`         | `200`                   | Milliseconds between frame captures |
| `PRESENCE_FRAMES_ARRIVE`    | `1`                     | Consecutive frames **with** the same QR decoded before emitting `arrived` |
| `PRESENCE_FRAMES_DEPART`    | `3`                     | Consecutive frames **without** that QR before emitting `departed` |
| `PRESENCE_MISS_GRACE`       | `1`                     | During arrival streak, tolerate this many missed frames (decrement instead of reset) |
| `OPENCV_ARRIVE_FRAMES_FLOOR` | `3`                    | When pyzbar is **not** loaded: minimum consecutive frames for `arrived` (OpenCV is noisier than pyzbar) |

Tune `PRESENCE_FRAMES_*` with `FRAME_INTERVAL_MS` in the field (e.g. more frames if the image is noisy). With OpenCV only, effective `arrived` frames = `max(PRESENCE_FRAMES_ARRIVE, OPENCV_ARRIVE_FRAMES_FLOOR)`.

## How it works

1. On startup, registers with the backend (`POST /eyes/register`) to learn which station it belongs to
2. Opens the webcam and captures frames at the configured interval (buffer is drained each cycle to ensure freshness)
3. Decodes **all** QR strings in each frame (pyzbar multi-decode, or OpenCV `detectAndDecodeMulti`)
4. **Tray code filter:** only payloads matching `TRAY-` + at least four digits (e.g. `TRAY-0001`) are tracked — drops most OpenCV noise
5. **Presence tracker** (per tray code): after N consecutive decodes → `POST /events` with `phase: "arrived"`; after M consecutive frames without that tray → `phase: "departed"`. Missed frames during the arrival streak are tolerated up to `PRESENCE_MISS_GRACE`
6. Multiple trays under one camera are tracked independently

## Reliability

**pyzbar** (with the zbar system library) is **required** for production: no false positives, sub-second detection, and `PRESENCE_FRAMES_ARRIVE=1` is safe.

- **macOS**: `brew install zbar` — then set `DYLD_LIBRARY_PATH=/opt/homebrew/lib` (pyzbar needs to find `libzbar.dylib`)
- **Ubuntu/Debian**: `sudo apt-get install libzbar0` — no path configuration needed
- **Without zbar**: Falls back to OpenCV's built-in detector. Only `TRAY-####` payloads are accepted; increase `OPENCV_ARRIVE_FRAMES_FLOOR` if you see ghost arrivals.

## Debugging

Set log level to DEBUG to see per-frame decode output:

```bash
PYTHONDONTWRITEBYTECODE=1 LOG_LEVEL=DEBUG uv run python -m src.main
```

## Tests

```bash
EYE_ID=test uv run pytest -v
```
