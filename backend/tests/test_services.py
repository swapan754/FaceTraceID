from app.services.face_service import FaceService
from app.services.search_service import SearchService
from app.services.verification_service import VerificationService


def test_face_service_embedding_generation():
    service = FaceService()
    faces, embedding = service.analyze(b"a" * 128)
    assert faces == 1
    assert len(embedding) == 24


def test_search_service_returns_sorted_matches():
    service = SearchService()
    matches = service.search_public_profiles("abcdef1234567890abcdef12")
    assert matches == sorted(matches, key=lambda x: x.confidence, reverse=True)


def test_verification_response_shape():
    service = VerificationService()
    result = service.verify(b"selfie-bytes", b"id-bytes")
    assert result.status == "ok"
    assert 0 <= result.confidence <= 100
    assert result.result in {"Verified", "Not Verified"}
