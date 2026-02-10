from typing import List
from ..models import MatchCard


PLATFORMS = [
    ("Instagram", "https://cdn.simpleicons.org/instagram"),
    ("Facebook", "https://cdn.simpleicons.org/facebook"),
    ("YouTube", "https://cdn.simpleicons.org/youtube"),
    ("TikTok", "https://cdn.simpleicons.org/tiktok"),
    ("X", "https://cdn.simpleicons.org/x"),
    ("LinkedIn", "https://cdn.simpleicons.org/linkedin"),
]


class SearchService:
    def search_public_profiles(self, embedding_id: str) -> List[MatchCard]:
        seed = int(embedding_id[:8], 16)
        cards: List[MatchCard] = []

        for i, (platform, logo) in enumerate(PLATFORMS):
            confidence = 55 + ((seed >> i) % 45)
            if confidence < 70:
                continue
            username = f"public_user_{embedding_id[i:i+4]}"
            cards.append(
                MatchCard(
                    platform=platform,
                    platform_logo=logo,
                    profile_url=f"https://example.com/{platform.lower()}/{username}",
                    username=username,
                    profile_image=f"https://api.dicebear.com/9.x/adventurer/png?seed={username}",
                    confidence=float(confidence),
                )
            )

        cards.sort(key=lambda c: c.confidence, reverse=True)
        return cards
