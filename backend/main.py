from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import aiofiles
import os
import tempfile
from openai import OpenAI
from config import settings
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI 상담사 정서 케어 API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 프론트엔드 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=settings.OPENAI_API_KEY)

# 업로드 디렉토리 생성
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@app.get("/")
async def root():
    return {"message": "AI 상담사 정서 케어 API"}

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    음성 파일을 텍스트로 변환하는 API
    """
    try:
        # 파일 형식 검증
        if not file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="오디오 파일만 업로드 가능합니다.")
        
        # 파일 크기 검증
        if file.size and file.size > settings.MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="파일 크기가 너무 큽니다. (최대 50MB)")
        
        # 임시 파일로 저장
        temp_file_path = os.path.join(settings.UPLOAD_DIR, f"temp_{file.filename}")
        
        async with aiofiles.open(temp_file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        logger.info(f"파일 업로드 완료: {file.filename}")
        
        # OpenAI Whisper API 호출
        try:
            with open(temp_file_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="ko"  # 한국어로 설정
                )
            
            logger.info(f"음성 변환 완료: {file.filename}")
            
            # 임시 파일 삭제
            os.remove(temp_file_path)
            
            return JSONResponse(content={
                "success": True,
                "text": transcript.text,
                "filename": file.filename,
                "language": "ko"
            })
            
        except Exception as e:
            logger.error(f"Whisper API 오류: {str(e)}")
            # 임시 파일 삭제
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            raise HTTPException(status_code=500, detail=f"음성 변환 중 오류가 발생했습니다: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"예상치 못한 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="서버 오류가 발생했습니다.")

@app.get("/health")
async def health_check():
    """
    서버 상태 확인
    """
    return {"status": "healthy", "message": "서버가 정상적으로 작동 중입니다."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 