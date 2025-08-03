@echo off
echo 은행 상담사 AI 서비스 백엔드 서버를 시작합니다...
echo.
cd backend
echo Python 환경을 확인합니다...
python --version
echo.
echo 필요한 패키지를 설치합니다...
pip install -r requirements.txt
echo.
echo 백엔드 서버를 시작합니다...
echo 서버 주소: http://localhost:8000
echo.
python main.py
pause 