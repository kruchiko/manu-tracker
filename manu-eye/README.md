# manu-eye

Camera station service — reads QR codes from a USB webcam and sends tracking events to the manu-gen backend.

## Quick start

```bash
# Install dependencies
uv sync

# Set required env vars (or create .env file)
export EYE_ID=eye-1
export BACKEND_URL=http://localhost:3000

# Run
uv run python -m src.main
```

## Configuration

| Variable               | Default                 | Description                             |
| ---------------------- | ----------------------- | --------------------------------------- |
| `EYE_ID`               | (required)              | Unique ID for this eye device           |
| `BACKEND_URL`          | `http://localhost:3000` | manu-gen backend base URL               |
| `DEDUP_WINDOW_SECONDS` | `30`                    | Seconds before same code can fire again |
| `CAMERA_INDEX`         | `0`                     | OpenCV camera device index              |
| `FRAME_INTERVAL_MS`    | `500`                   | Milliseconds between frame captures     |

## How it works

1. On startup, registers with the backend (`POST /eyes/register`) to learn which station it belongs to
2. Opens the webcam and captures frames at the configured interval
3. Decodes QR codes in each frame (pyzbar, falls back to OpenCV)
4. Deduplicates — same code only fires once per dedup window
5. Sends `POST /events` to the backend for each new sighting

## Tests

```bash
EYE_ID=test uv run pytest -v
```

## System dependencies

pyzbar requires the zbar shared library:

- **macOS**: `brew install zbar`
- **Ubuntu/Debian**: `sudo apt-get install libzbar0`
- **Without zbar**: Falls back to OpenCV's built-in QR detector (slower, less reliable)
