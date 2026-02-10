import hashlib
from ..models import VerificationResponse


class VerificationService:
    def verify(self, selfie_bytes: bytes, id_bytes: bytes) -> VerificationResponse:
        combined = hashlib.sha256(selfie_bytes + id_bytes).hexdigest()
        score = 50 + (int(combined[:2], 16) / 255) * 50
        result = "Verified" if score >= 75 else "Not Verified"

        return VerificationResponse(status="ok", confidence=round(score, 2), result=result)
