import { useState, useCallback } from 'react'
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

  // 텍스트를 요약하는 함수 - 간단하게 수정
  const summarizeTextContent = useCallback(async (text: string) => {
    if (!text.trim() || text.trim().length < 10) {
      console.log('텍스트가 너무 짧습니다:', text.trim().length, '자')
      return null
    }
    
    console.log('📝 요약 시작:', text.substring(0, 50) + '...')
    
    setAiAnalysisState(prev => ({
      ...prev, 
      isSummarizing: true, 
      summaryError: ""
    }))
    
    try {
      const result = await summarizeText(text)
      
      if (result.success && result.summary) {
        console.log('✅ 요약 완료:', result.summary)
        
        setAiAnalysisState(prev => ({
          ...prev, 
          summary: result.summary || "",
          isSummarizing: false 
        }))
        
        return result.summary
      } else {
        throw new Error(result.error || '요약에 실패했습니다.')
      }
    } catch (error) {
      console.error('❌ 요약 오류:', error)
      
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      
      setAiAnalysisState(prev => ({
        ...prev, 
        summaryError: errorMessage,
        isSummarizing: false 
      }))
      
      return null
    }
  }, [])

  // 스크립트를 생성하는 함수
  const generateScriptContent = useCallback(async (text: string) => {
    console.log('📄 === generateScriptContent 시작 ===')
    console.log('스크립트 생성할 텍스트:', text.substring(0, 100) + '...')
    console.log('텍스트 길이:', text.trim().length, '자')
    
    if (!text.trim()) {
      console.log('❌ 텍스트가 비어있어서 스크립트 생성 건너뜀')
      return null
    }
    
    setAiAnalysisState(prev => ({ 
      ...prev, 
      isGeneratingScript: true, 
      scriptError: "" 
    }))
    
    try {
      console.log('📡 스크립트 API 호출 시작...')
      const result = await generateScript(text)
      console.log('📡 스크립트 API 응답:', result)
      
      if (result.success && result.script) {
        console.log('✅ 스크립트 생성 완료:', result.script.substring(0, 100) + '...')
        console.log('스크립트 길이:', result.script.length, '자')
        setAiAnalysisState(prev => ({ 
          ...prev, 
          script: result.script || "",
          isGeneratingScript: false 
        }))
        return result.script
      } else {
        console.error('❌ 스크립트 생성 실패:', result.error)
        throw new Error(result.error || '스크립트 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('❌ 스크립트 생성 오류:', error)
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
    console.log('🚀 generateSummaryAndScript 호출됨:', {
      textLength: text?.trim().length,
      textPreview: text?.substring(0, 50) + '...'
    })
    
    if (!text.trim() || text.trim().length < 10) {
      console.log('텍스트가 너무 짧습니다:', text.trim().length, '자')
      return
    }
    
    console.log('🚀 요약 및 스크립트 생성 시작:', text.substring(0, 50) + '...')
    
    try {
      // 요약 생성
      console.log('📝 요약 생성 시작...')
      const summaryResult = await summarizeTextContent(text)
      console.log('✅ 요약 생성 완료:', summaryResult ? '성공' : '실패')
      
      // 스크립트 생성
      console.log('📄 스크립트 생성 시작...')
      const scriptResult = await generateScriptContent(text)
      console.log('✅ 스크립트 생성 완료:', scriptResult ? '성공' : '실패')
      
      console.log('🎉 요약 및 스크립트 생성 완료')
    } catch (error) {
      console.error('❌ 요약 및 스크립트 생성 오류:', error)
    }
  }, [summarizeTextContent, generateScriptContent])

  // 상태 초기화
  const resetAIAnalysis = useCallback(() => {
    setAiAnalysisState({
      summary: "",
      isSummarizing: false,
      summaryError: "",
      script: "",
      isGeneratingScript: false,
      scriptError: ""
    })
  }, [])

  return {
    aiAnalysisState,
    summarizeTextContent,
    generateScriptContent,
    generateSummaryAndScript,
    resetAIAnalysis
  }
} 