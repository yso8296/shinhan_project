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
if settings.OPENAI_API_KEY:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
else:
    client = None
    logger.warning("OpenAI API 키가 설정되지 않았습니다. AI 기능이 제한됩니다.")

# 업로드 디렉토리 생성
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# 웹소켓 연결 관리
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"웹소켓 연결됨. 총 연결 수: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"웹소켓 연결 해제됨. 총 연결 수: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"웹소켓 메시지 전송 실패: {e}")

manager = ConnectionManager()

# 요청 모델
class SummaryRequest(BaseModel):
    text: str

@app.get("/")
async def root():
    return {"message": "AI 상담사 정서 케어 API"}

@app.websocket("/ws/audio-stream")
async def websocket_audio_stream(websocket: WebSocket):
    """
    실시간 음성 스트리밍을 위한 웹소켓 엔드포인트
    """
    await manager.connect(websocket)
    logger.info("실시간 음성 스트리밍 웹소켓 연결됨")
    
    # 중복 텍스트 방지를 위한 변수
    last_transcript = ""
    
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
                
                current_text = transcript.text.strip()
                logger.info(f"실시간 음성 변환 완료: {current_text}")
                
                # 불필요한 텍스트 필터링 (더 관대하게)
                filtered_text = current_text.replace('시청해주셔서 감사합니다.', '').replace('감사합니다.', '').replace('고맙습니다.', '').strip()
                
                # 중복 텍스트 방지 (더 관대하게)
                if filtered_text and filtered_text != last_transcript and len(filtered_text) > 1:
                    last_transcript = filtered_text
                    
                    # 결과를 클라이언트로 전송
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "transcription",
                            "text": filtered_text,
                            "timestamp": asyncio.get_event_loop().time()
                        }, ensure_ascii=False),
                        websocket
                    )
                    logger.info(f"중복되지 않은 텍스트 전송: {filtered_text}")
                else:
                    logger.info("중복 텍스트 또는 빈 텍스트로 전송 건너뜀")
                
            except Exception as e:
                logger.error(f"Whisper API 오류: {str(e)}")
                await manager.send_personal_message(
                    json.dumps({
                        "type": "error",
                        "message": f"음성 변환 중 오류가 발생했습니다: {str(e)}"
                    }, ensure_ascii=False),
                    websocket
                )
            finally:
                # 임시 파일 삭제
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
                    logger.info(f"임시 파일 삭제됨: {temp_file_path}")
                    
    except WebSocketDisconnect:
        logger.info("실시간 음성 스트리밍 웹소켓 연결 해제됨")
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"웹소켓 오류: {str(e)}")
        manager.disconnect(websocket)

@app.websocket("/ws/real-time-analysis")
async def websocket_real_time_analysis(websocket: WebSocket):
    """
    실시간 위험도 분석을 위한 웹소켓 엔드포인트
    """
    await manager.connect(websocket)
    logger.info("실시간 분석 웹소켓 연결됨")
    
    try:
        while True:
            # 클라이언트로부터 메시지 수신
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            message_type = message_data.get("type")
            
            if message_type == "text_chunk":
                # 텍스트 청크를 받아서 위험도 분석
                text_chunk = message_data.get("text", "")
                chunk_id = message_data.get("chunk_id", 0)
                
                if text_chunk.strip():
                    try:
                        # 위험도 분석 수행
                        response = client.chat.completions.create(
                            model="gpt-3.5-turbo",
                            messages=[
                                {
                                    "role": "system",
                                    "content": "당신은 은행 상담사 정서 케어를 위한 AI 어시스턴트입니다. 고객의 대화 내용을 실시간으로 분석하여 위험도를 판단해주세요.\n\n다음 기준으로 위험도를 분류해주세요:\n\n1. 정상 단계 (0-30점): 일반적인 문의나 불만, 정상적인 감정 표현\n2. 경고 단계 (31-70점): 강한 불만, 감정적 표현, 약간의 공격적 어조\n3. 위험 단계 (71-100점): 극도의 분노, 폭력적 표현, 자해/타해 위험, 심각한 감정적 위기\n\n분석 결과를 다음 JSON 형식으로 반환해주세요:\n{\n  \"risk_level\": 점수(0-100),\n  \"risk_stage\": \"정상\" 또는 \"경고\" 또는 \"위험\",\n  \"emotion\": 주요 감정 상태,\n  \"analysis\": 위험도 판단 근거\n}"
                                },
                                {
                                    "role": "user",
                                    "content": f"다음 고객 대화 내용의 위험도를 실시간으로 분석해주세요: {text_chunk}"
                                }
                            ],
                            max_tokens=200,
                            temperature=0.1
                        )
                        
                        analysis_text = response.choices[0].message.content.strip()
                        
                        # JSON 파싱 시도
                        try:
                            analysis_data = json.loads(analysis_text)
                            risk_result = {
                                "type": "risk_analysis",
                                "chunk_id": chunk_id,
                                "risk_level": analysis_data.get("risk_level", 0),
                                "risk_stage": analysis_data.get("risk_stage", "정상"),
                                "emotion": analysis_data.get("emotion", ""),
                                "analysis": analysis_data.get("analysis", ""),
                                "text_chunk": text_chunk
                            }
                        except json.JSONDecodeError:
                            # JSON 파싱 실패 시 기본값 사용
                            risk_result = {
                                "type": "risk_analysis",
                                "chunk_id": chunk_id,
                                "risk_level": 0,
                                "risk_stage": "정상",
                                "emotion": "",
                                "analysis": analysis_text,
                                "text_chunk": text_chunk
                            }
                        
                        # 분석 결과를 클라이언트에 전송
                        await manager.send_personal_message(
                            json.dumps(risk_result, ensure_ascii=False),
                            websocket
                        )
                        
                        logger.info(f"실시간 위험도 분석 완료 - 청크 {chunk_id}: {risk_result['risk_stage']}")
                        
                    except Exception as e:
                        logger.error(f"실시간 위험도 분석 오류: {e}")
                        error_result = {
                            "type": "error",
                            "chunk_id": chunk_id,
                            "error": str(e)
                        }
                        await manager.send_personal_message(
                            json.dumps(error_result, ensure_ascii=False),
                            websocket
                        )
            
            elif message_type == "ping":
                # 연결 상태 확인
                await manager.send_personal_message(
                    json.dumps({"type": "pong"}),
                    websocket
                )
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("실시간 분석 웹소켓 연결 해제됨")
    except Exception as e:
        logger.error(f"웹소켓 오류: {e}")
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
        # API 키 확인
        if not settings.OPENAI_API_KEY:
            logger.error("OpenAI API 키가 설정되지 않았습니다.")
            raise HTTPException(
                status_code=500, 
                detail="OpenAI API 키가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY를 추가해주세요."
            )
        
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="요약할 텍스트가 없습니다.")
        
        # 텍스트 길이 검증
        if len(request.text.strip()) < 10:
            raise HTTPException(status_code=400, detail="요약할 텍스트가 너무 짧습니다. 최소 10자 이상이 필요합니다.")
        
        logger.info(f"요약 요청 받음: 텍스트 길이 {len(request.text)}자")
        
        # OpenAI GPT API 호출
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "당신은 은행 상담사 정서 케어를 위한 AI 어시스턴트입니다. 고객의 문의 내용을 분석하여 3-4문장으로 간결하고 명확하게 요약해주세요.\n\n다음 순서로 요약해주세요:\n1. 고객의 주요 문의사항과 상황\n2. 고객의 감정 상태와 배경\n3. 고객이 직면한 문제나 어려움\n4. 고객이 원하는 해결책이나 추가 문의사항\n\n격식체로 작성하고, 자연스럽게 연결되는 문장들로 구성해주세요. 전체 내용을 종합적으로 분석하여 요약해주세요."
                    },
                    {
                        "role": "user",
                        "content": f"다음 고객 문의 내용을 전체적으로 분석하여 요약해주세요: {request.text}"
                    }
                ],
                max_tokens=400,
                temperature=0.1
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
        # API 키 확인
        if not settings.OPENAI_API_KEY:
            logger.error("OpenAI API 키가 설정되지 않았습니다.")
            raise HTTPException(
                status_code=500, 
                detail="OpenAI API 키가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY를 추가해주세요."
            )
        
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="스크립트를 생성할 텍스트가 없습니다.")
        
        logger.info(f"스크립트 생성 요청 받음: 텍스트 길이 {len(request.text)}자")
        
        # OpenAI GPT API 호출
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "당신은 은행 상담사 정서 케어를 위한 AI 어시스턴트입니다. 고객의 문의 내용을 분석하여 상담사가 사용할 수 있는 맞춤형 대응 스크립트를 생성해주세요.\n\n다음 3단계로 구성된 자연스러운 대화 스크립트를 작성해주세요:\n\n먼저 고객의 상황과 감정에 대한 이해와 공감을 표현하고, 그 다음 고객의 문제에 대한 구체적이고 실용적인 해결 방안을 제시하며, 마지막으로 향후 유사한 문제 방지를 위한 추가 서비스나 안내를 제공해주세요.\n\n각 단계는 자연스럽게 연결되며, '1단계', '2단계' 등의 번호 표기는 사용하지 말고 고객의 감정 상태와 문의 내용에 맞는 따뜻하고 전문적인 톤으로 자연스러운 대화 형식으로 작성해주세요. 반드시 완전한 문장으로 끝내주세요."
                    },
                    {
                        "role": "user",
                        "content": f"다음 고객 문의 내용을 바탕으로 상담 스크립트를 생성해주세요: {request.text}"
                    }
                ],
                max_tokens=600,
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

@app.post("/analyze-risk")
async def analyze_risk(request: SummaryRequest):
    """
    고객 대화 내용을 분석하여 위험도를 판단하는 API
    """
    try:
        # API 키 확인
        if not settings.OPENAI_API_KEY:
            logger.error("OpenAI API 키가 설정되지 않았습니다.")
            raise HTTPException(
                status_code=500, 
                detail="OpenAI API 키가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY를 추가해주세요."
            )
        
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="분석할 텍스트가 없습니다.")
        
        logger.info(f"위험도 분석 요청 받음: 텍스트 길이 {len(request.text)}자")
        
        # OpenAI GPT API 호출
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "당신은 은행 상담사 정서 케어를 위한 AI 어시스턴트입니다. 고객의 대화 내용을 분석하여 위험도를 판단해주세요.\n\n다음 기준으로 위험도를 분류해주세요:\n\n1. 정상 단계 (0-30점): 일반적인 문의나 불만, 정상적인 감정 표현\n2. 경고 단계 (31-70점): 강한 불만, 감정적 표현, 약간의 공격적 어조\n3. 위험 단계 (71-100점): 극도의 분노, 폭력적 표현, 자해/타해 위험, 심각한 감정적 위기\n\n분석 결과를 다음 JSON 형식으로 반환해주세요:\n{\n  \"risk_level\": 점수(0-100),\n  \"risk_stage\": \"정상\" 또는 \"경고\" 또는 \"위험\",\n  \"emotion\": 주요 감정 상태,\n  \"analysis\": 위험도 판단 근거\n}"
                    },
                    {
                        "role": "user",
                        "content": f"다음 고객 대화 내용의 위험도를 분석해주세요: {request.text}"
                    }
                ],
                max_tokens=300,
                temperature=0.1
            )
            
            analysis_text = response.choices[0].message.content.strip()
            logger.info(f"위험도 분석 완료: {analysis_text}")
            
            # JSON 파싱 시도
            try:
                import json
                analysis_data = json.loads(analysis_text)
                return JSONResponse(content={
                    "success": True,
                    "risk_level": analysis_data.get("risk_level", 0),
                    "risk_stage": analysis_data.get("risk_stage", "정상"),
                    "emotion": analysis_data.get("emotion", ""),
                    "analysis": analysis_data.get("analysis", ""),
                    "raw_response": analysis_text
                })
            except json.JSONDecodeError:
                # JSON 파싱 실패 시 텍스트에서 정보 추출
                risk_level = 0
                risk_stage = "정상"
                
                if "위험" in analysis_text:
                    risk_stage = "위험"
                    risk_level = 80
                elif "경고" in analysis_text:
                    risk_stage = "경고"
                    risk_level = 50
                
                return JSONResponse(content={
                    "success": True,
                    "risk_level": risk_level,
                    "risk_stage": risk_stage,
                    "emotion": "",
                    "analysis": analysis_text,
                    "raw_response": analysis_text
                })
            
        except Exception as e:
            logger.error(f"GPT API 오류: {str(e)}")
            raise HTTPException(status_code=500, detail=f"위험도 분석 중 오류가 발생했습니다: {str(e)}")
            
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