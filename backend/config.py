import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "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")
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB

settings = Settings() 