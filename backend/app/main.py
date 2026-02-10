from collections import defaultdict
from pathlib import Path
from typing import Dict, List

from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .models import HistoryEntry, ScanResponse, VerificationResponse
from .services.face_service import FaceService
from .services.search_service import SearchService
from .services.storage import delete_temp_file, save_temp_file
from .services.security import EncryptionService
from .services.verification_service import VerificationService

app = FastAPI(title="FaceTraceID API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_SIZE_BYTES = 10 * 1024 * 1024

face_service = FaceService()
search_service = SearchService()
verification_service = VerificationService()
encryption_service = EncryptionService()

history_store: Dict[str, List[HistoryEntry]] = defaultdict(list)


async def _read_and_validate(file: UploadFile) -> bytes:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file format.")

    content = await file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds 10MB limit.")

    return content


@app.post("/api/v1/scan", response_model=ScanResponse)
async def scan_face(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    user_id: str = Form(default="guest"),
) -> ScanResponse:
    content = await _read_and_validate(image)
    encrypted = encryption_service.encrypt(content)
    decrypted = encryption_service.decrypt(encrypted)

    temp_path: Path = save_temp_file(decrypted, ALLOWED_TYPES[image.content_type])
    background_tasks.add_task(delete_temp_file, temp_path)

    try:
        faces_detected, embedding_id = face_service.analyze(decrypted)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if faces_detected != 1:
        raise HTTPException(status_code=400, detail="Please upload an image with exactly one main face.")

    matches = search_service.search_public_profiles(embedding_id)

    history_store[user_id].append(
        HistoryEntry(user_id=user_id, action="scan", summary=f"{len(matches)} match(es) found")
    )

    return ScanResponse(status="ok", faces_detected=faces_detected, embedding_id=embedding_id, matches=matches)


@app.post("/api/v1/verify", response_model=VerificationResponse)
async def verify_identity(
    background_tasks: BackgroundTasks,
    selfie: UploadFile = File(...),
    id_photo: UploadFile = File(...),
    user_id: str = Form(default="guest"),
) -> VerificationResponse:
    selfie_bytes = await _read_and_validate(selfie)
    id_bytes = await _read_and_validate(id_photo)

    selfie_path = save_temp_file(selfie_bytes, ALLOWED_TYPES[selfie.content_type])
    id_path = save_temp_file(id_bytes, ALLOWED_TYPES[id_photo.content_type])
    background_tasks.add_task(delete_temp_file, selfie_path)
    background_tasks.add_task(delete_temp_file, id_path)

    result = verification_service.verify(selfie_bytes, id_bytes)
    history_store[user_id].append(
        HistoryEntry(user_id=user_id, action="verify", summary=f"Result: {result.result} ({result.confidence}%)")
    )
    return result


@app.get("/api/v1/history/{user_id}", response_model=List[HistoryEntry])
async def get_history(user_id: str) -> List[HistoryEntry]:
    return history_store[user_id]


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
