from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
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

# 요청 모델
class SummaryRequest(BaseModel):
    text: str

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

@app.post("/summarize")
async def summarize_text(request: SummaryRequest):
    """
    텍스트를 요약하는 API
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="요약할 텍스트가 없습니다.")
        
        # OpenAI GPT API 호출
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "당신은 은행 상담사 정서 케어를 위한 AI 어시스턴트입니다. 고객의 문의 내용을 간결하고 명확하게 요약해주세요. 요약은 20자 이내로 작성하고, 고객의 주요 문의사항과 감정 상태를 파악할 수 있도록 해주세요."
                    },
                    {
                        "role": "user",
                        "content": f"다음 고객 문의 내용을 요약해주세요: {request.text}"
                    }
                ],
                max_tokens=100,
                temperature=0.3
            )
            
            summary = response.choices[0].message.content.strip()
            logger.info(f"텍스트 요약 완료: {summary}")
            
            return JSONResponse(content={
                "success": True,
                "summary": summary,
                "original_text": request.text
            })
            
        except Exception as e:
            logger.error(f"GPT API 오류: {str(e)}")
            raise HTTPException(status_code=500, detail=f"요약 중 오류가 발생했습니다: {str(e)}")
            
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