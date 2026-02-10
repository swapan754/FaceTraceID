import hashlib
from typing import Tuple


class FaceService:
    """
    Extensible face service.

    Replace `analyze` internals with ArcFace/FaceNet/DeepFace inference in production.
    """

    def analyze(self, image_bytes: bytes) -> Tuple[int, str]:
        if len(image_bytes) < 64:
            raise ValueError("Image appears invalid or too small.")

        # Placeholder single-face detection heuristic.
        faces_detected = 1

        embedding_id = hashlib.sha256(image_bytes).hexdigest()[:24]
        return faces_detected, embedding_id
