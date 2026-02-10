from pydantic import BaseModel, Field
from typing import List, Literal


class MatchCard(BaseModel):
    platform: str
    platform_logo: str
    profile_url: str
    username: str
    profile_image: str
    confidence: float = Field(ge=0, le=100)


class ScanResponse(BaseModel):
    status: Literal["ok"]
    faces_detected: int
    embedding_id: str
    matches: List[MatchCard]


class VerificationResponse(BaseModel):
    status: Literal["ok"]
    confidence: float = Field(ge=0, le=100)
    result: Literal["Verified", "Not Verified"]


class HistoryEntry(BaseModel):
    user_id: str
    action: Literal["scan", "verify"]
    summary: str
