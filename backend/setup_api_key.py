#!/usr/bin/env python3
"""
OpenAI API 키를 쉽게 설정할 수 있는 대화형 스크립트
"""

import os
import sys

def setup_api_key():
    """대화형으로 API 키를 설정합니다."""
    
    print("🔑 OpenAI API 키 설정 도구")
    print("=" * 40)
    
    # 현재 API 키 확인
    current_key = os.getenv("OPENAI_API_KEY")
    if current_key:
        masked_key = current_key[:10] + "..." if len(current_key) > 10 else current_key
        print(f"현재 설정된 API 키: {masked_key}")
        response = input("새로운 API 키로 변경하시겠습니까? (y/N): ").strip().lower()
        if response != 'y':
            print("설정을 취소했습니다.")
            return
    
    print("\n📝 OpenAI API 키를 입력해주세요:")
    print("(API 키는 https://platform.openai.com/api-keys 에서 발급받을 수 있습니다)")
    
    while True:
        api_key = input("API 키: ").strip()
        
        if not api_key:
            print("❌ API 키를 입력해주세요.")
            continue
            
        if not api_key.startswith("sk-"):
            print("❌ API 키는 'sk-'로 시작해야 합니다.")
            continue
            
        # API 키 형식이 올바른지 확인
        if len(api_key) < 20:
            print("❌ API 키가 너무 짧습니다.")
            continue
            
        break
    
    # .env 파일 생성
    env_content = f"OPENAI_API_KEY={api_key}\n"
    
    try:
        with open(".env", "w", encoding="utf-8") as f:
            f.write(env_content)
        
        print("\n✅ API 키가 성공적으로 설정되었습니다!")
        print("📁 .env 파일이 생성되었습니다.")
        
        # 설정 확인
        os.environ["OPENAI_API_KEY"] = api_key
        print(f"🔍 설정 확인: {api_key[:10]}...")
        
        print("\n🚀 이제 서버를 재시작하면 API 키가 적용됩니다.")
        
    except Exception as e:
        print(f"❌ 파일 생성 중 오류가 발생했습니다: {e}")
        print("\n대안: 환경 변수로 직접 설정하세요:")
        print(f"$env:OPENAI_API_KEY=\"{api_key}\"")

if __name__ == "__main__":
    setup_api_key() 