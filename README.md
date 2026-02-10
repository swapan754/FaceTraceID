# FaceTraceID

FaceTraceID is a privacy-first web/mobile-ready application that helps users check where their face appears publicly online and optionally perform basic identity verification.

## What this implementation includes

- **Responsive web app UI** (works on desktop + mobile browsers)
- **FastAPI backend** with endpoints for:
  - photo upload and validation
  - face analysis/embedding generation (extensible mock)
  - social-platform match search (pluggable mock providers)
  - identity verification mode (selfie vs ID comparison)
- **Security foundations**:
  - in-memory encryption of uploaded bytes
  - automatic file cleanup after processing
  - no data selling / no long-term image storage by default
- **Search history** endpoint for profile screen UX

> ⚠️ Note: Real social media reverse-face search is heavily restricted by each platform's policy and API limitations. This code provides a compliant architecture with public-data provider adapters and mock matching logic for local development.

## Architecture

- `backend/` FastAPI API layer and services
- `web/` responsive single-page app that consumes backend APIs

## Run locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Web app

```bash
cd web
python -m http.server 4173
```

Open `http://localhost:4173`.

Set API URL in browser local storage if needed:

```js
localStorage.setItem('facetrace_api', 'http://localhost:8000')
```


### Offline demo fallback

If the backend is unavailable, the web app now automatically switches to **offline demo mode** so the UI remains usable:
- mock platform matches are generated locally from the uploaded filename
- verification returns a demo confidence
- history is stored in browser local storage

## API overview

- `POST /api/v1/scan` multipart form with `image`, optional `user_id`
- `POST /api/v1/verify` multipart form with `selfie`, `id_photo`, optional `user_id`
- `GET /api/v1/history/{user_id}`

## Privacy controls implemented

- File type whitelist: JPG, PNG, WEBP
- File size limit: 10MB
- Single-face requirement enforced by analysis service
- Uploaded bytes encrypted in memory during processing
- Temporary files deleted via background tasks

