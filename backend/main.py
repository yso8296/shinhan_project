from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import aiofiles
import os
import tempfile
from openai import OpenAI
from config import settings
import logging
import json
import asyncio
import wave
import numpy as np
from typing import List

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

# 웹소켓 연결 관리
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

manager = ConnectionManager()

# 요청 모델
class SummaryRequest(BaseModel):
    text: str

@app.get("/")
async def root():
    return {"message": "AI 상담사 정서 케어 API"}

@app.websocket("/ws/audio-stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    logger.info(f"웹소켓 연결됨: {id(websocket)}")
    
    try:
        while True:
            # 클라이언트로부터 오디오 청크 수신
            data = await websocket.receive_bytes()
            logger.info(f"오디오 청크 수신됨: {len(data)} bytes")
            
            # 임시 파일로 저장
            temp_file_path = os.path.join(settings.UPLOAD_DIR, f"temp_chunk_{id(websocket)}_{int(asyncio.get_event_loop().time())}.wav")
            
            try:
                # WAV 파일로 저장 (16kHz, 16bit, mono)
                with wave.open(temp_file_path, 'wb') as wav_file:
                    wav_file.setnchannels(1)  # mono
                    wav_file.setsampwidth(2)  # 16bit
                    wav_file.setframerate(16000)  # 16kHz
                    wav_file.writeframes(data)
                
                logger.info(f"임시 파일 저장됨: {temp_file_path}")
                
                # OpenAI Whisper API 호출
                with open(temp_file_path, "rb") as audio_file:
                    transcript = client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        language="ko"
                    )
                
                logger.info(f"음성 변환 완료: {transcript.text}")
                
                # 결과를 클라이언트로 전송
                if transcript.text.strip():
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "transcription",
                            "text": transcript.text,
                            "timestamp": asyncio.get_event_loop().time()
                        }),
                        websocket
                    )
                else:
                    logger.info("변환된 텍스트가 없습니다.")
                
            except Exception as e:
                logger.error(f"Whisper API 오류: {str(e)}")
                await manager.send_personal_message(
                    json.dumps({
                        "type": "error",
                        "message": f"음성 변환 중 오류가 발생했습니다: {str(e)}"
                    }),
                    websocket
                )
            finally:
                # 임시 파일 삭제
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
                    logger.info(f"임시 파일 삭제됨: {temp_file_path}")
                    
    except WebSocketDisconnect:
        logger.info(f"웹소켓 연결 해제됨: {id(websocket)}")
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"웹소켓 오류: {str(e)}")
        manager.disconnect(websocket)

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
                        "content": "당신은 은행 상담사 정서 케어를 위한 AI 어시스턴트입니다. 고객의 문의 내용을 분석하여 자연스러운 3문장으로 요약해주세요:\n\n첫 번째 문장에서는 고객의 주요 문의사항과 구체적인 상황을 설명하고, 두 번째 문장에서는 고객의 감정 상태와 배경 상황을 설명하며, 세 번째 문장에서는 고객이 원하는 해결책이나 추가 문의사항을 설명해주세요.\n\n각 문장은 구체적이고 명확하게 작성하며, '첫 번째 문장', '두 번째 문장' 등의 표기는 사용하지 말고 자연스럽게 연결되는 3문장으로 작성해주세요."
                    },
                    {
                        "role": "user",
                        "content": f"다음 고객 문의 내용을 3문장으로 요약해주세요: {request.text}"
                    }
                ],
                max_tokens=300,
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

@app.post("/generate-script")
async def generate_script(request: SummaryRequest):
    """
    고객 대화 내용을 분석하여 맞춤형 상담 스크립트를 생성하는 API
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="스크립트를 생성할 텍스트가 없습니다.")
        
        # OpenAI GPT API 호출
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "당신은 은행 상담사 정서 케어를 위한 AI 어시스턴트입니다. 고객의 문의 내용을 분석하여 상담사가 사용할 수 있는 맞춤형 대응 스크립트를 생성해주세요.\n\n다음 3단계로 구성된 자연스러운 대화 스크립트를 작성해주세요:\n\n먼저 고객의 상황과 감정에 대한 이해와 공감을 표현하고, 그 다음 고객의 문제에 대한 구체적이고 실용적인 해결 방안을 제시하며, 마지막으로 향후 유사한 문제 방지를 위한 추가 서비스나 안내를 제공해주세요.\n\n각 단계는 자연스럽게 연결되며, '1단계', '2단계' 등의 번호 표기는 사용하지 말고 고객의 감정 상태와 문의 내용에 맞는 따뜻하고 전문적인 톤으로 자연스러운 대화 형식으로 작성해주세요."
                    },
                    {
                        "role": "user",
                        "content": f"다음 고객 문의 내용을 바탕으로 상담 스크립트를 생성해주세요: {request.text}"
                    }
                ],
                max_tokens=400,
                temperature=0.3
            )
            
            script = response.choices[0].message.content.strip()
            logger.info(f"상담 스크립트 생성 완료: {script}")
            
            return JSONResponse(content={
                "success": True,
                "script": script,
                "original_text": request.text
            })
            
        except Exception as e:
            logger.error(f"GPT API 오류: {str(e)}")
            raise HTTPException(status_code=500, detail=f"스크립트 생성 중 오류가 발생했습니다: {str(e)}")
            
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