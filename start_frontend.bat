@echo off
echo 은행 상담사 AI 서비스 프론트엔드를 시작합니다...
echo.
cd frontend
echo Node.js 환경을 확인합니다...
node --version
echo.
echo 필요한 패키지를 설치합니다...
npm install
echo.
echo 프론트엔드 서버를 시작합니다...
echo 서버 주소: http://localhost:3000
echo.
npm run dev
pause 