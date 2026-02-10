from pathlib import Path
from uuid import uuid4

TMP_DIR = Path("/tmp/facetrace")
TMP_DIR.mkdir(parents=True, exist_ok=True)


def save_temp_file(content: bytes, suffix: str) -> Path:
    path = TMP_DIR / f"{uuid4().hex}{suffix}"
    path.write_bytes(content)
    return path


def delete_temp_file(path: Path) -> None:
    if path.exists():
        path.unlink(missing_ok=True)
