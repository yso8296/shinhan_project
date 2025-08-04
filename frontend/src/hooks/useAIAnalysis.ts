import { useState, useCallback, useEffect } from 'react'
import { AIAnalysisState } from '@/types/audio'
import { summarizeText, generateScript } from '@/utils/api'

export const useAIAnalysis = () => {
  const [aiAnalysisState, setAiAnalysisState] = useState<AIAnalysisState>({
    summary: "",
    isSummarizing: false,
    summaryError: "",
    script: "",
    isGeneratingScript: false,
    scriptError: ""
  })

  // 상태 변경 감지를 위한 로그
  useEffect(() => {
    console.log('🔧 AI 분석 상태 변경됨:', aiAnalysisState)
  }, [aiAnalysisState])

  // 텍스트를 요약하는 함수
  const summarizeTextContent = useCallback(async (text: string) => {
    console.log('📝 === summarizeTextContent 시작 ===')
    console.log('요약할 텍스트:', text.substring(0, 100) + '...')
    console.log('전체 텍스트 길이:', text.trim().length, '자')
    
    if (!text.trim()) {
      console.log('텍스트가 비어있어서 요약 건너뜀')
      return null
    }
    
    // 텍스트가 너무 짧으면 요약하지 않음
    if (text.trim().length < 10) {
      console.log('텍스트가 너무 짧아서 요약 건너뜀 (길이:', text.trim().length, '자)')
      return null
    }
    
    console.log('🔧 요약 상태 설정: isSummarizing = true')
    setAiAnalysisState(prev => {
      console.log('🔧 이전 AI 분석 상태:', prev)
      const newState = { ...prev, isSummarizing: true, summaryError: "" }
      console.log('🔧 업데이트된 AI 분석 상태 (isSummarizing):', newState)
      return newState
    })
    
    try {
      console.log('📡 summarizeText API 호출 시작...')
      const result = await summarizeText(text)
      console.log('📡 summarizeText API 응답:', result)
      
      if (result.success && result.summary) {
        console.log('✅ 요약 완료:', result.summary)
        console.log('요약 길이:', result.summary.length, '자')
        console.log('🔧 요약 상태 업데이트: summary =', result.summary)
        
        // 상태 업데이트를 즉시 실행
        setAiAnalysisState(prev => {
          console.log('🔧 요약 완료 전 AI 분석 상태:', prev)
          const newState = { 
            ...prev, 
            summary: result.summary || "",
            isSummarizing: false 
          }
          console.log('🔧 요약 완료 후 새로운 AI 분석 상태:', newState)
          return newState
        })
        
        // 상태 업데이트 확인을 위한 추가 로그
        setTimeout(() => {
          console.log('🔧 상태 업데이트 후 확인 (1초 후):', aiAnalysisState)
        }, 1000)
        
        return result.summary
      } else {
        console.error('요약 응답이 올바르지 않음:', result)
        throw new Error(result.error || '요약 결과가 올바르지 않습니다.')
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
      
      console.log('🔧 오류 상태 설정: summaryError =', errorMessage)
      setAiAnalysisState(prev => {
        console.log('🔧 오류 발생 전 AI 분석 상태:', prev)
        const newState = { 
          ...prev, 
          summaryError: errorMessage,
          isSummarizing: false 
        }
        console.log('🔧 오류 발생 후 새로운 AI 분석 상태:', newState)
        return newState
      })
      return null
    }
  }, [])

  // 스크립트를 생성하는 함수
  const generateScriptContent = useCallback(async (text: string) => {
    console.log('=== generateScriptContent 시작 ===')
    if (!text.trim()) return null
    
    setAiAnalysisState(prev => ({ ...prev, isGeneratingScript: true, scriptError: "" }))
    
    try {
      const result = await generateScript(text)
      
      if (result.success && result.script) {
        console.log('스크립트 생성 완료:', result.script)
        setAiAnalysisState(prev => ({ 
          ...prev, 
          script: result.script || "",
          isGeneratingScript: false 
        }))
        return result.script
      } else {
        throw new Error(result.error || '스크립트 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('스크립트 생성 오류:', error)
      setAiAnalysisState(prev => ({ 
        ...prev, 
        scriptError: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        isGeneratingScript: false 
      }))
      return null
    }
  }, [])

  // 요약과 스크립트를 동시에 생성하는 함수
  const generateSummaryAndScript = useCallback(async (text: string) => {
    console.log('=== generateSummaryAndScript 시작 ===')
    console.log('입력 텍스트:', text.substring(0, 100) + '...')
    console.log('전체 텍스트 길이:', text.trim().length, '자')
    
    if (!text.trim()) {
      console.log('텍스트가 비어있어서 요약/스크립트 생성 건너뜀')
      return
    }
    
    // 텍스트가 너무 짧으면 요약하지 않음
    if (text.trim().length < 10) {
      console.log('텍스트가 너무 짧아서 요약/스크립트 생성 건너뜀 (길이:', text.trim().length, '자)')
      return
    }
    
    console.log('✅ 텍스트 검증 완료 - 요약/스크립트 생성 시작')
    
    // 각각 독립적으로 실행하여 하나가 실패해도 다른 것이 실행되도록 함
    try {
      // 요약 생성
      console.log('요약 생성 시작...')
      const summaryResult = await summarizeTextContent(text)
      if (summaryResult) {
        console.log('요약 생성 완료:', summaryResult)
      } else {
        console.log('요약 생성 실패: 결과가 null')
      }
    } catch (error) {
      console.error('요약 생성 오류:', error)
    }
    
    try {
      // 스크립트 생성
      console.log('스크립트 생성 시작...')
      const scriptResult = await generateScriptContent(text)
      if (scriptResult) {
        console.log('스크립트 생성 완료:', scriptResult)
      }
    } catch (error) {
      console.error('스크립트 생성 오류:', error)
    }
    
    console.log('=== generateSummaryAndScript 완료 ===')
  }, [summarizeTextContent, generateScriptContent])

  // 상태 초기화
  const resetAIAnalysis = useCallback(() => {
    console.log('🔧 AI 분석 상태 초기화 시작')
    setAiAnalysisState({
      summary: "",
      isSummarizing: false,
      summaryError: "",
      script: "",
      isGeneratingScript: false,
      scriptError: ""
    })
    console.log('🔧 AI 분석 상태 초기화 완료')
  }, [])

  return {
    aiAnalysisState,
    summarizeTextContent,
    generateScriptContent,
    generateSummaryAndScript,
    resetAIAnalysis
  }
} 