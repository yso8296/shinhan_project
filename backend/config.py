import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

class Settings:
    # OpenAI API 키 설정 (환경 변수에서 가져오거나 기본값 사용)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    
    # API 키가 없으면 경고 메시지 출력
    if not OPENAI_API_KEY:
        print("⚠️  경고: OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.")
        print("   .env 파일에 OPENAI_API_KEY=your_api_key_here 를 추가해주세요.")
        print("   또는 환경 변수로 설정해주세요.")
    
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB

settings = Settings() 