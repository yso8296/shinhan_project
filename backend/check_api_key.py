#!/usr/bin/env python3
"""
OpenAI API 키 설정 상태를 확인하는 스크립트
"""

import os
from dotenv import load_dotenv

def check_api_key():
    """API 키 설정 상태를 확인하고 결과를 출력합니다."""
    
    # .env 파일 로드
    load_dotenv()
    
    # API 키 가져오기
    api_key = os.getenv("OPENAI_API_KEY")
    
    print("🔍 OpenAI API 키 설정 상태 확인")
    print("=" * 50)
    
    if api_key:
        # API 키의 첫 10자리만 표시 (보안상)
        masked_key = api_key[:10] + "..." if len(api_key) > 10 else api_key
        print(f"✅ API 키가 설정되어 있습니다: {masked_key}")
        
        # API 키 형식 검증
        if api_key.startswith("sk-"):
            print("✅ API 키 형식이 올바릅니다")
        else:
            print("⚠️  API 키 형식이 올바르지 않습니다 (sk-로 시작해야 함)")
            
        return True
    else:
        print("❌ API 키가 설정되지 않았습니다")
        print("\n📝 설정 방법:")
        print("1. backend 디렉토리에 .env 파일을 생성하세요")
        print("2. .env 파일에 다음 내용을 추가하세요:")
        print("   OPENAI_API_KEY=sk-your_actual_api_key_here")
        print("3. 또는 시스템 환경 변수로 설정하세요")
        print("\n📖 자세한 설정 방법은 API_KEY_SETUP.md 파일을 참조하세요")
        return False

if __name__ == "__main__":
    check_api_key() 