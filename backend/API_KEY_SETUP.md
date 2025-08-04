# OpenAI API 키 설정 방법

## 1. OpenAI API 키 발급받기

1. [OpenAI 웹사이트](https://platform.openai.com/api-keys)에 접속
2. 로그인 후 "Create new secret key" 클릭
3. API 키를 복사하여 안전한 곳에 보관

## 2. 환경 변수 설정 방법

### 방법 1: .env 파일 생성 (권장)

backend 디렉토리에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
OPENAI_API_KEY=sk-your_actual_api_key_here
```

### 방법 2: 시스템 환경 변수 설정

#### Windows (PowerShell)
```powershell
$env:OPENAI_API_KEY="sk-your_actual_api_key_here"
```

#### Windows (Command Prompt)
```cmd
set OPENAI_API_KEY=sk-your_actual_api_key_here
```

#### macOS/Linux
```bash
export OPENAI_API_KEY="sk-your_actual_api_key_here"
```

## 3. 설정 확인

서버를 재시작한 후 다음 명령어로 API 키가 제대로 설정되었는지 확인할 수 있습니다:

```bash
python -c "import os; print('API Key:', os.getenv('OPENAI_API_KEY', 'Not set')[:10] + '...' if os.getenv('OPENAI_API_KEY') else 'Not set')"
```

## 4. 주의사항

- API 키는 절대 공개 저장소에 커밋하지 마세요
- `.env` 파일은 `.gitignore`에 포함되어 있어야 합니다
- API 키는 정기적으로 갱신하는 것을 권장합니다

## 5. 문제 해결

API 키 설정 후에도 문제가 발생한다면:

1. 서버를 완전히 재시작하세요
2. 환경 변수가 제대로 설정되었는지 확인하세요
3. OpenAI 계정에 충분한 크레딧이 있는지 확인하세요 