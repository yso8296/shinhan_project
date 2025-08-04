import { useState, useCallback } from 'react'
import { TranscriptionState } from '@/types/audio'
import { transcribeAudio } from '@/utils/api'

export const useTranscription = () => {
  const [transcriptionState, setTranscriptionState] = useState<TranscriptionState>({
    transcribedText: "",
    isTranscribing: false,
    error: "",
    displayedText: "",
    isTyping: false,
    realTimeText: "",
    isRealTimeTranscribing: false
  })

  // 타이핑 속도
  const typingSpeed = 120

  // 텍스트를 점진적으로 표시하는 함수
  const typeTextProgressively = useCallback((fullText: string) => {
    console.log('=== typeTextProgressively 시작 ===')
    console.log('전체 텍스트:', fullText)
    
    if (!fullText.trim()) return
    
    setTranscriptionState(prev => ({ ...prev, isTyping: true, displayedText: "" }))
    
    let currentIndex = 0
    const totalLength = fullText.length
    
    const typeNextChar = () => {
      if (currentIndex < totalLength) {
        setTranscriptionState(prev => ({ 
          ...prev, 
          displayedText: fullText.substring(0, currentIndex + 1) 
        }))
        currentIndex++
        setTimeout(typeNextChar, typingSpeed)
      } else {
        setTranscriptionState(prev => ({ ...prev, isTyping: false }))
        console.log('=== typeTextProgressively 완료 ===')
      }
    }
    
    typeNextChar()
  }, [])

  // 음성을 텍스트로 변환하는 함수
  const transcribeAudioFile = useCallback(async (file: File) => {
    console.log('=== transcribeAudioFile 시작 ===')
    console.log('파일:', file.name, file.size)
    
    setTranscriptionState(prev => ({ ...prev, isTranscribing: true, error: "" }))
    
    try {
      const result = await transcribeAudio(file)
      
      if (result.success && result.text) {
        setTranscriptionState(prev => ({ 
          ...prev, 
          transcribedText: result.text,
          isTranscribing: false 
        }))
        console.log('음성 변환 완료:', result.text)
        
        // 음성 변환이 완료되면 항상 점진적 표시 시작
        console.log('음성 변환 완료 후 점진적 표시 시작')
        typeTextProgressively(result.text)
      } else {
        throw new Error(result.error || '음성 변환에 실패했습니다.')
      }
    } catch (error) {
      console.error('음성 변환 오류:', error)
      setTranscriptionState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        isTranscribing: false 
      }))
    }
  }, [typeTextProgressively])

  // 실시간 텍스트 업데이트
  const updateRealTimeText = useCallback((text: string) => {
    setTranscriptionState(prev => ({ ...prev, realTimeText: text }))
  }, [])

  // 실시간 변환 상태 설정
  const setRealTimeTranscribing = useCallback((isTranscribing: boolean) => {
    setTranscriptionState(prev => ({ ...prev, isRealTimeTranscribing: isTranscribing }))
  }, [])

  // 상태 초기화
  const resetTranscription = useCallback(() => {
    setTranscriptionState({
      transcribedText: "",
      isTranscribing: false,
      error: "",
      displayedText: "",
      isTyping: false,
      realTimeText: "",
      isRealTimeTranscribing: false
    })
  }, [])

  return {
    transcriptionState,
    typeTextProgressively,
    transcribeAudioFile,
    updateRealTimeText,
    setRealTimeTranscribing,
    resetTranscription
  }
} 