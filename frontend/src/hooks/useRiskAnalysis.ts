import { useState, useCallback, useEffect } from 'react'
import { RiskAnalysisState } from '@/types/audio'
import { analyzeRisk } from '@/utils/api'

export const useRiskAnalysis = (isPlaying: boolean, realTimeText: string, displayedText: string) => {
  const [riskAnalysisState, setRiskAnalysisState] = useState<RiskAnalysisState>({
    riskLevel: 0,
    riskStage: "정상",
    emotion: "",
    analysis: "",
    isAnalyzing: false,
    error: "",
    realTimeRiskLevel: 0,
    realTimeRiskStage: "정상"
  })

  // 위험도 분석 함수
  const performRiskAnalysis = useCallback(async (text: string) => {
    console.log('=== performRiskAnalysis 시작 ===')
    if (!text.trim()) return null
    
    setRiskAnalysisState(prev => ({ ...prev, isAnalyzing: true, error: "" }))
    
    try {
      const result = await analyzeRisk(text)
      
      if (result.success && result.data) {
        console.log('🎯 위험도 분석 결과:', result.data.riskStage, result.data.riskLevel)
        
        setRiskAnalysisState(prev => ({
          ...prev,
          riskLevel: result.data.riskLevel,
          riskStage: result.data.riskStage,
          emotion: result.data.emotion,
          analysis: result.data.analysis,
          realTimeRiskLevel: result.data.riskLevel,
          realTimeRiskStage: result.data.riskStage,
          isAnalyzing: false
        }))
        
        return result.data
      } else {
        throw new Error(result.error || '위험도 분석에 실패했습니다.')
      }
    } catch (error) {
      console.error('위험도 분석 오류:', error)
      setRiskAnalysisState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        isAnalyzing: false 
      }))
      return null
    }
  }, [])

  // 실시간 위험도 분석 useEffect
  useEffect(() => {
    console.log('🔍 실시간 위험도 분석 useEffect 실행:', { 
      isPlaying, 
      realTimeTextLength: realTimeText?.length, 
      displayedTextLength: displayedText?.length
    })
    
    // 재생 중이 아니면 분석 중단
    if (!isPlaying) {
      console.log('⏸️ 재생 중이 아니므로 위험도 분석 중단')
      return
    }
    
    const currentText = realTimeText || displayedText
    if (!currentText || currentText.length < 5) {
      console.log('📝 분석할 텍스트가 부족함')
      return
    }
    
    console.log('🚀 실시간 위험도 분석 시작:', currentText.substring(0, 50) + '...')
    
    // 즉시 위험도 분석 실행
    const executeRiskAnalysis = async () => {
      try {
        const result = await performRiskAnalysis(currentText)
        if (result) {
          console.log('🎯 위험도 분석 결과:', result.riskStage, result.riskLevel)
          
          // 위험도에 따른 즉시 차단 로직은 상위 컴포넌트에서 처리
          if (result.riskStage === "위험" || result.riskStage === "경고") {
            console.log(`🚨 ${result.riskStage} 단계 감지: 차단 신호 발생`)
            // 여기서는 상태만 업데이트하고, 실제 차단은 상위 컴포넌트에서 처리
          }
        }
      } catch (error) {
        console.error('❌ 위험도 분석 오류:', error)
      }
    }
    
    // 즉시 분석 실행
    executeRiskAnalysis()
    
    // 3초마다 반복 분석 (재생 중일 때만)
    const interval = setInterval(() => {
      // 재생 중이 아니면 인터벌 중단
      if (!isPlaying) {
        console.log('⏸️ 재생 중지로 인한 분석 중단')
        clearInterval(interval)
        return
      }
      
      const updatedText = realTimeText || displayedText
      if (updatedText && updatedText.length >= 5) {
        console.log('🔄 주기적 위험도 분석 실행')
        executeRiskAnalysis()
      }
    }, 3000)
    
    // 클린업 함수
    return () => {
      clearInterval(interval)
      console.log('🧹 위험도 분석 인터벌 정리')
    }
  }, [isPlaying, realTimeText, displayedText, performRiskAnalysis])

  // 재생 상태가 변경될 때마다 강제로 인터벌 정리
  useEffect(() => {
    if (!isPlaying) {
      console.log('🛑 재생 중지 감지 - 위험도 분석 완전 중단')
      // 재생이 중지되면 분석 상태도 초기화
      setRiskAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        realTimeRiskLevel: 0,
        realTimeRiskStage: "정상"
      }))
    } else {
      console.log('▶️ 재생 시작 감지 - 위험도 분석 준비')
    }
  }, [isPlaying])

  // 상태 초기화
  const resetRiskAnalysis = useCallback(() => {
    setRiskAnalysisState({
      riskLevel: 0,
      riskStage: "정상",
      emotion: "",
      analysis: "",
      isAnalyzing: false,
      error: "",
      realTimeRiskLevel: 0,
      realTimeRiskStage: "정상"
    })
  }, [])

  return {
    riskAnalysisState,
    performRiskAnalysis,
    resetRiskAnalysis
  }
} 