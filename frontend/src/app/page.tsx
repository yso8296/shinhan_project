"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { 
  Upload, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Search,
  Menu,
  Settings,
  Wifi,
  WifiOff,
  Server,
  ServerOff,
  Clock,
  CheckCircle,
  AlertCircle,
  Heart,
  Volume2,
  Shield,
  AlertTriangle,
  Mic,
  MicOff,
  Bell,
  BarChart3
} from "lucide-react"

// 커스텀 훅들
import { useAudioPlayer } from "@/hooks/useAudioPlayer"
import { useTranscription } from "@/hooks/useTranscription"
import { useAIAnalysis } from "@/hooks/useAIAnalysis"
import { useRiskAnalysis } from "@/hooks/useRiskAnalysis"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useServerStatus } from "@/hooks/useServerStatus"

// 컴포넌트들
import { Header } from "@/components/Header"
import { AudioWaveform } from "@/components/AudioWaveform"
import { RealTimeText } from "@/components/RealTimeText"
import { AISummary } from "@/components/AISummary"
import { ResponseScript } from "@/components/ResponseScript"
import { RiskAnalysis } from "@/components/RiskAnalysis"

export default function Home() {
  // UI 상태
  const [isRecording, setIsRecording] = useState(true)
  const [riskLevel, setRiskLevel] = useState(15)
  const [latency, setLatency] = useState(91)
  const [currentTime, setCurrentTime] = useState(0)
  const [autoProtection, setAutoProtection] = useState(true)
  const [sensitivity, setSensitivity] = useState([50])
  const [showSettings, setShowSettings] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false) // 위험도 차단 상태

  // 커스텀 훅들 사용
  const {
    audioState,
    audioRef,
    handleFileUpload,
    togglePlayPause,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleVolumeChange,
    onEnded,
    stopAudio,
    formatTime
  } = useAudioPlayer()

  const {
    transcriptionState,
    typeTextProgressively,
    transcribeAudioFile,
    updateRealTimeText,
    setRealTimeTranscribing,
    resetTranscription
  } = useTranscription()

  const {
    aiAnalysisState,
    summarizeTextContent,
    generateScriptContent,
    generateSummaryAndScript,
    resetAIAnalysis
  } = useAIAnalysis()

  const {
    riskAnalysisState,
    performRiskAnalysis,
    resetRiskAnalysis
  } = useRiskAnalysis(
    audioState.isPlaying,
    transcriptionState.realTimeText,
    transcriptionState.displayedText
  )

  const {
    webSocketState,
    mediaRecorder,
    connectWebSocketConnection,
    disconnectWebSocket,
    startAudioStream,
    stopAudioStream
  } = useWebSocket()

  const { serverState } = useServerStatus()

  // 실시간 업데이트 효과
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(prev => (prev + 0.1) % 180) // 3분(180초) 주기
      setLatency(prev => Math.max(50, Math.min(150, prev + (Math.random() - 0.5) * 10)))
      
      // 리스크 레벨 동적 변화 (실제 환경 시뮬레이션)
      if (Math.random() > 0.95) {
        setRiskLevel(prev => Math.min(100, prev + Math.random() * 10))
      } else if (Math.random() > 0.9) {
        setRiskLevel(prev => Math.max(0, prev - Math.random() * 5))
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  // 파일 업로드 처리 (통합)
  const handleFileUploadIntegrated = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('=== 파일 업로드 시작 ===')
    console.log('파일 정보:', file.name, file.size, file.type)

    // 모든 상태 초기화
    handleFileUpload(event)
    resetTranscription()
    resetAIAnalysis()
    resetRiskAnalysis()
    disconnectWebSocket()
    stopAudioStream()

    console.log('=== 파일 업로드 완료 ===')
  }, [handleFileUpload, resetTranscription, resetAIAnalysis, resetRiskAnalysis, disconnectWebSocket, stopAudioStream])

  // 재생/일시정지 토글 (통합)
  const togglePlayPauseIntegrated = useCallback(async () => {
    if (!audioState.file) {
      console.log('오디오 파일이 없습니다.')
      return
    }
    
    if (audioState.isPlaying) {
      // 일시정지
      togglePlayPause()
      setRealTimeTranscribing(false)
      disconnectWebSocket()
      stopAudioStream()
      console.log('오디오 일시정지 및 웹소켓 연결 해제')
    } else {
      // 재생 시작
      console.log('오디오 재생 시작')
      togglePlayPause()
      
      // 웹소켓 연결
      connectWebSocketConnection(
        (data) => {
          console.log('웹소켓 메시지 수신:', data)
          if (data.type === 'risk_analysis') {
            // 위험도 분석 결과 처리
            console.log(`실시간 위험도 업데이트: ${data.risk_stage} (${data.risk_level}점)`)
          }
        },
        () => console.log('웹소켓 연결됨'),
        () => console.log('웹소켓 연결 해제됨')
      )
      
      // 실시간 음성 스트리밍 시작
      startAudioStream(
        (text) => {
          console.log('실시간 텍스트 업데이트:', text)
          // 차단 상태가 아닐 때만 텍스트 업데이트
          if (!isBlocked) {
            updateRealTimeText(text)
          } else {
            console.log('🚫 차단 상태: 실시간 텍스트 업데이트 차단됨')
          }
        },
        (error) => console.error('실시간 음성 변환 오류:', error)
      )
      
      // 백업용 음성 변환 (실시간이 실패할 경우를 대비)
      if (!transcriptionState.transcribedText) {
        console.log('백업용 음성 변환 시작...')
        await transcribeAudioFile(audioState.file!)
      } else if (!transcriptionState.displayedText) {
        // 이미 변환된 텍스트가 있으면 점진적 표시 시작
        console.log('기존 텍스트 점진적 표시 시작')
        typeTextProgressively(transcriptionState.transcribedText)
      }
    }
  }, [
    audioState.file,
    audioState.isPlaying,
    transcriptionState.transcribedText,
    transcriptionState.displayedText,
    togglePlayPause,
    setRealTimeTranscribing,
    disconnectWebSocket,
    stopAudioStream,
    connectWebSocketConnection,
    startAudioStream,
    updateRealTimeText,
    transcribeAudioFile,
    typeTextProgressively,
    isBlocked
  ])

  // 오디오 재생 종료 처리 (통합)
  const onEndedIntegrated = useCallback(() => {
    console.log('오디오 재생 종료')
    
    onEnded()
    setRealTimeTranscribing(false)
    disconnectWebSocket()
    stopAudioStream()
    
    // 실시간 텍스트 초기화 (재생 종료 시)
    updateRealTimeText("")
    
    // 위험도 분석 상태 완전 초기화
    resetRiskAnalysis()
    console.log('🛑 재생 종료: 위험도 분석 완전 중단')
    
    // 재생 종료 시 2초 후 요약 및 스크립트 실행 (텍스트 변환 완료 대기)
    setTimeout(() => {
      const currentText = transcriptionState.transcribedText
      console.log('🎯 재생 종료 후 요약/스크립트 체크:', {
        hasText: !!currentText,
        textLength: currentText?.trim().length,
        textPreview: currentText?.substring(0, 50) + '...'
      })
      
      if (currentText && currentText.trim().length >= 10) {
        console.log('🎯 재생 종료 후 요약/스크립트 시작:', currentText.substring(0, 50) + '...')
        
        // 요약과 스크립트를 독립적으로 실행
        if (!aiAnalysisState.summary && !aiAnalysisState.isSummarizing) {
          console.log('📝 재생 종료 후 요약 생성 시작...')
          summarizeTextContent(currentText)
        }
        
        if (!aiAnalysisState.script && !aiAnalysisState.isGeneratingScript) {
          console.log('📄 재생 종료 후 스크립트 생성 시작...')
          generateScriptContent(currentText)
        }
      } else {
        console.log('❌ 요약/스크립트 조건 불충족:', {
          hasText: !!currentText,
          textLength: currentText?.trim().length
        })
      }
    }, 2000)
    
    console.log('모든 실시간 처리 중단 완료')
  }, [onEnded, setRealTimeTranscribing, disconnectWebSocket, stopAudioStream, updateRealTimeText, resetRiskAnalysis, aiAnalysisState.summary, aiAnalysisState.isSummarizing, aiAnalysisState.script, aiAnalysisState.isGeneratingScript, summarizeTextContent, generateScriptContent])

  // 위험도에 따른 차단 처리
  useEffect(() => {
    if (riskAnalysisState.realTimeRiskStage === "위험") {
      console.log(`🚨 ${riskAnalysisState.realTimeRiskStage} 단계 감지: 즉시 차단 시작`)
      
      // 차단 상태 설정
      setIsBlocked(true)
            
      // 오디오 강제 정지
      stopAudio()
            
      // 미디어 레코더 정지
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
        console.log('🎤 미디어 레코더 정지 완료')
      }
            
      // 실시간 처리 중단
      setRealTimeTranscribing(false)
      
      // 실시간 텍스트 완전 차단
      updateRealTimeText("")
      console.log('📝 실시간 텍스트 차단 완료')
            
      // 웹소켓 연결 해제
      disconnectWebSocket()
      stopAudioStream()
      
      console.log(`${riskAnalysisState.realTimeRiskStage} 단계 차단 완료!`)
    } else if (riskAnalysisState.realTimeRiskStage === "정상" && isBlocked) {
      // 위험도가 정상으로 돌아오면 차단 해제
      console.log('✅ 위험도 정상화: 차단 해제')
      setIsBlocked(false)
      
      // 실시간 텍스트 다시 활성화
      if (audioState.isPlaying) {
        console.log('📝 실시간 텍스트 다시 활성화')
        setRealTimeTranscribing(true)
      }
    }
  }, [riskAnalysisState.realTimeRiskStage, isBlocked, stopAudio, mediaRecorder, setRealTimeTranscribing, updateRealTimeText, disconnectWebSocket, stopAudioStream, audioState.isPlaying])

  // 텍스트 변환 완료 시 요약 및 스크립트 실행 (백업)
  useEffect(() => {
    const currentText = transcriptionState.transcribedText
    
    console.log('🔍 요약/스크립트 백업 useEffect 실행:', {
      hasText: !!currentText,
      textLength: currentText?.trim().length,
      isTranscribing: transcriptionState.isTranscribing,
      hasSummary: !!aiAnalysisState.summary,
      hasScript: !!aiAnalysisState.script,
      isSummarizing: aiAnalysisState.isSummarizing,
      isGeneratingScript: aiAnalysisState.isGeneratingScript
    })
    
    // 이미 요약과 스크립트가 있거나 진행 중이면 실행하지 않음
    if ((aiAnalysisState.summary && aiAnalysisState.script) || 
        aiAnalysisState.isSummarizing || 
        aiAnalysisState.isGeneratingScript) {
      console.log('❌ 요약/스크립트 이미 존재하거나 진행 중')
      return
    }
    
    // 텍스트가 있고, 변환이 완료되었을 때 요약 및 스크립트 실행
    if (currentText && currentText.trim().length >= 10 && !transcriptionState.isTranscribing) {
      console.log('📝 텍스트 변환 완료 - 요약 및 스크립트 시작:', currentText.substring(0, 50) + '...')
      
      // 요약과 스크립트를 독립적으로 실행
      if (!aiAnalysisState.summary && !aiAnalysisState.isSummarizing) {
        console.log('📝 요약 생성 시작...')
        summarizeTextContent(currentText)
      }
      
      if (!aiAnalysisState.script && !aiAnalysisState.isGeneratingScript) {
        console.log('📄 스크립트 생성 시작...')
        generateScriptContent(currentText)
      }
    }
  }, [transcriptionState.transcribedText, transcriptionState.isTranscribing, aiAnalysisState.summary, aiAnalysisState.script, aiAnalysisState.isSummarizing, aiAnalysisState.isGeneratingScript, summarizeTextContent, generateScriptContent])

  // 요약 및 스크립트 재시도 함수
  const handleRetrySummary = useCallback(() => {
    const currentText = transcriptionState.transcribedText
    
    if (currentText && currentText.trim().length >= 10 && 
        !aiAnalysisState.isSummarizing && 
        !aiAnalysisState.isGeneratingScript) {
      console.log('재시도 요약 및 스크립트 시작:', currentText.substring(0, 50) + '...')
      
      // 요약과 스크립트를 독립적으로 실행
      if (!aiAnalysisState.summary) {
        console.log('📝 재시도 요약 생성 시작...')
        summarizeTextContent(currentText)
      }
      
      if (!aiAnalysisState.script) {
        console.log('📄 재시도 스크립트 생성 시작...')
        generateScriptContent(currentText)
      }
    }
  }, [transcriptionState.transcribedText, aiAnalysisState.summary, aiAnalysisState.script, aiAnalysisState.isSummarizing, aiAnalysisState.isGeneratingScript, summarizeTextContent, generateScriptContent])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4 md:p-6">
      {/* Audio Element */}
      {audioState.url && (
        <audio
          ref={audioRef}
          src={audioState.url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={onEndedIntegrated}
        />
      )}

      {/* Header */}
      <Header serverState={serverState} />

      <div className="grid gap-6 max-w-6xl mx-auto">
        {/* Audio Waveform Section */}
        <AudioWaveform
          audioState={audioState}
          onFileUpload={handleFileUploadIntegrated}
          onTogglePlayPause={togglePlayPauseIntegrated}
          formatTime={formatTime}
        />

        {/* Real-time Text Section */}
        <RealTimeText
          transcriptionState={transcriptionState}
          latency={latency}
          isBlocked={isBlocked}
        />

        {/* AI 대화 내용 요약 */}
        <AISummary
          aiAnalysisState={aiAnalysisState}
          serverState={serverState}
          onRetrySummary={handleRetrySummary}
          displayedText={transcriptionState.displayedText}
          realTimeText={transcriptionState.realTimeText}
          transcribedText={transcriptionState.transcribedText}
        />

        {/* Response Script Section */}
        <ResponseScript
          aiAnalysisState={aiAnalysisState}
          displayedText={transcriptionState.displayedText}
        />

        {/* 실시간 위험도 분석 */}
        <RiskAnalysis
          riskAnalysisState={riskAnalysisState}
          isPlaying={audioState.isPlaying}
        />
      </div>
    </div>
  )
}
