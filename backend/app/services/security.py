import os
from cryptography.fernet import Fernet


class EncryptionService:
    def __init__(self) -> None:
        key = os.getenv("FACETRACE_ENCRYPTION_KEY")
        if key is None:
            key = Fernet.generate_key().decode("utf-8")
        self._fernet = Fernet(key.encode("utf-8"))

    def encrypt(self, raw: bytes) -> bytes:
        return self._fernet.encrypt(raw)

    def decrypt(self, token: bytes) -> bytes:
        return self._fernet.decrypt(token)
