// 음성을 텍스트로 변환하는 함수
export const transcribeAudio = async (file: File): Promise<{ success: boolean; text?: string; error?: string }> => {
  console.log('=== transcribeAudio 시작 ===')
  console.log('파일:', file.name, file.size)
  
  try {
    console.log('음성 변환 API 호출 시작...')
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('http://localhost:8000/transcribe', {
      method: 'POST',
      body: formData,
    })
    
    console.log('음성 변환 API 응답 상태:', response.status, response.ok)
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('백엔드 서버가 실행되지 않았습니다. 서버를 먼저 실행해주세요.')
      }
      throw new Error(`서버 오류: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('음성 변환 API 응답 데이터:', data)
    
    if (data.success) {
      console.log('음성 변환 완료:', data.text)
      return { success: true, text: data.text }
    } else {
      throw new Error('음성 변환에 실패했습니다.')
    }
  } catch (error) {
    console.error('음성 변환 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }
  }
}

// 텍스트를 요약하는 함수
export const summarizeText = async (text: string): Promise<{ success: boolean; summary?: string; error?: string }> => {
  console.log('📝 === summarizeText 시작 ===')
  console.log('요약할 텍스트:', text.substring(0, 100) + '...')
  console.log('전체 텍스트 길이:', text.trim().length, '자')
  
  if (!text.trim()) {
    console.log('텍스트가 비어있어서 요약 건너뜀')
    return { success: false, error: '텍스트가 비어있습니다.' }
  }
  
  // 텍스트 길이 검증 (10자 이상으로 변경)
  if (text.trim().length < 10) {
    console.log('텍스트가 너무 짧아서 요약 건너뜀 (길이:', text.trim().length, '자)')
    return { success: false, error: '텍스트가 너무 짧습니다. 최소 10자 이상이 필요합니다.' }
  }
  
  try {
    console.log('📡 요약 API 호출 시작...')
    
    const response = await fetch('http://localhost:8000/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })
    
    console.log('📡 요약 API 응답 상태:', response.status, response.ok)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('서버 오류 응답:', errorText)
      
      if (response.status === 404) {
        throw new Error('백엔드 서버가 실행되지 않았습니다. 서버를 먼저 실행해주세요.')
      }
      if (response.status === 500) {
        // API 키 오류인지 확인
        if (errorText.includes('OPENAI_API_KEY')) {
          throw new Error('OpenAI API 키가 설정되지 않았습니다. 백엔드 서버의 .env 파일에 OPENAI_API_KEY를 추가해주세요.')
        }
        throw new Error('서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      }
      if (response.status === 0) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw new Error(`서버 오류: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('📡 요약 API 응답 데이터:', data)
    
    if (data.success && data.summary) {
      console.log('✅ 요약 완료:', data.summary)
      console.log('요약 길이:', data.summary.length, '자')
      return { success: true, summary: data.summary }
    } else if (data.success && data.text) {
      // 백엔드에서 'text' 필드로 응답하는 경우
      console.log('✅ 요약 완료 (text 필드):', data.text)
      console.log('요약 길이:', data.text.length, '자')
      return { success: true, summary: data.text }
    } else {
      console.error('요약 응답이 올바르지 않음:', data)
      throw new Error('요약 결과가 올바르지 않습니다.')
    }
  } catch (error) {
    console.error('❌ 요약 오류:', error)
    
    let errorMessage = '알 수 없는 오류가 발생했습니다.'
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        errorMessage = '백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'
      } else {
        errorMessage = error.message
      }
    }
    
    return { success: false, error: errorMessage }
  }
}

// 스크립트를 생성하는 함수
export const generateScript = async (text: string): Promise<{ success: boolean; script?: string; error?: string }> => {
  console.log('📄 === generateScript 시작 ===')
  console.log('스크립트 생성할 텍스트:', text.substring(0, 100) + '...')
  console.log('텍스트 길이:', text.trim().length, '자')
  
  if (!text.trim()) {
    console.log('❌ 텍스트가 비어있어서 스크립트 생성 건너뜀')
    return { success: false, error: '텍스트가 비어있습니다.' }
  }
  
  try {
    console.log('📡 스크립트 API 호출 시작...')
    const response = await fetch('http://localhost:8000/generate-script', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })
    
    console.log('📡 스크립트 API 응답 상태:', response.status, response.ok)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ 서버 오류 응답:', errorText)
      
      if (response.status === 404) {
        throw new Error('백엔드 서버가 실행되지 않았습니다. 서버를 먼저 실행해주세요.')
      }
      if (response.status === 500) {
        // API 키 오류인지 확인
        if (errorText.includes('OPENAI_API_KEY')) {
          throw new Error('OpenAI API 키가 설정되지 않았습니다. 백엔드 서버의 .env 파일에 OPENAI_API_KEY를 추가해주세요.')
        }
        throw new Error('서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      }
      if (response.status === 0) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw new Error(`서버 오류: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('📡 스크립트 API 응답 데이터:', data)
    
    if (data.success && data.script) {
      console.log('✅ 스크립트 생성 완료:', data.script.substring(0, 100) + '...')
      console.log('스크립트 길이:', data.script.length, '자')
      return { success: true, script: data.script }
    } else {
      console.error('❌ 스크립트 응답이 올바르지 않음:', data)
      throw new Error('스크립트 결과가 올바르지 않습니다.')
    }
  } catch (error) {
    console.error('❌ 스크립트 생성 오류:', error)
    
    let errorMessage = '알 수 없는 오류가 발생했습니다.'
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        errorMessage = '백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'
      } else {
        errorMessage = error.message
      }
    }
    
    return { success: false, error: errorMessage }
  }
}

// 위험도 분석 함수
export const analyzeRisk = async (text: string): Promise<{ success: boolean; data?: any; error?: string }> => {
  console.log('=== analyzeRisk 시작 ===')
  if (!text.trim()) {
    return { success: false, error: '텍스트가 비어있습니다.' }
  }
  
  try {
    console.log('위험도 분석 API 호출 시작...')
    const response = await fetch('http://localhost:8000/analyze-risk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })
    
    console.log('위험도 분석 API 응답 상태:', response.status, response.ok)
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('백엔드 서버가 실행되지 않았습니다. 서버를 먼저 실행해주세요.')
      }
      throw new Error(`서버 오류: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('위험도 분석 API 응답 데이터:', data)
    
    if (data.success) {
      const result = {
        riskLevel: data.risk_level,
        riskStage: data.risk_stage,
        emotion: data.emotion,
        analysis: data.analysis
      }
      console.log('위험도 분석 완료:', data.risk_stage, data.risk_level)
      return { success: true, data: result }
    } else {
      throw new Error('위험도 분석에 실패했습니다.')
    }
  } catch (error) {
    console.error('위험도 분석 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }
  }
}

// 서버 상태 확인 함수
export const checkServerStatus = async (): Promise<'connected' | 'disconnected'> => {
  console.log('=== 서버 상태 확인 시작 ===')
  try {
    const response = await fetch('http://localhost:8000/health')
    console.log('서버 상태 응답:', response.status, response.ok)
    
    if (response.ok) {
      console.log('서버 연결됨')
      return 'connected'
    } else {
      console.log('서버 연결 안됨 (응답 오류)')
      return 'disconnected'
    }
  } catch (error) {
    console.error('서버 연결 오류:', error)
    return 'disconnected'
  }
} 