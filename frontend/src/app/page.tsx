"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

export default function Home() {
  // UI 상태
  const [isRecording, setIsRecording] = useState(true)
  const [riskLevel, setRiskLevel] = useState(15)
  const [latency, setLatency] = useState(91)
  const [currentTime, setCurrentTime] = useState(0)
  const [autoProtection, setAutoProtection] = useState(true)
  const [sensitivity, setSensitivity] = useState([50])
  const [showSettings, setShowSettings] = useState(false)

  // 오디오 관련 상태
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [volume, setVolume] = useState([50])
  const audioRef = useRef<HTMLAudioElement>(null)

  // 텍스트 변환 관련 상태
  const [transcribedText, setTranscribedText] = useState("")
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionError, setTranscriptionError] = useState("")
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  // AI 요약 관련 상태
  const [summary, setSummary] = useState("")
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summaryError, setSummaryError] = useState("")

  // 스크립트 관련 상태
  const [script, setScript] = useState("")
  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [scriptError, setScriptError] = useState("")

  // 위험도 분석 관련 상태
  const [riskAnalysis, setRiskAnalysis] = useState({
    riskLevel: 0,
    riskStage: "정상",
    emotion: "",
    analysis: ""
  })
  const [isAnalyzingRisk, setIsAnalyzingRisk] = useState(false)
  const [riskError, setRiskError] = useState("")

  // 웹소켓 관련 상태
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null)
  const [isWsConnected, setIsWsConnected] = useState(false)
  const [realTimeRiskLevel, setRealTimeRiskLevel] = useState(0)
  const [realTimeRiskStage, setRealTimeRiskStage] = useState("정상")

  // 실시간 음성 변환 관련 상태
  const [realTimeText, setRealTimeText] = useState("")
  const [isRealTimeTranscribing, setIsRealTimeTranscribing] = useState(false)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)

  // 서버 상태
  const [serverStatus, setServerStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')

  // 타이핑 속도
  const typingSpeed = 120

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

  // 서버 상태 확인
  useEffect(() => {
    checkServerStatus()
  }, [])

  const checkServerStatus = async () => {
    console.log('=== 서버 상태 확인 시작 ===')
    try {
      const response = await fetch('http://localhost:8000/health')
      console.log('서버 상태 응답:', response.status, response.ok)
      
      if (response.ok) {
        setServerStatus('connected')
        console.log('서버 연결됨')
      } else {
        setServerStatus('disconnected')
        console.log('서버 연결 안됨 (응답 오류)')
      }
    } catch (error) {
      console.error('서버 연결 오류:', error)
      setServerStatus('disconnected')
    }
    console.log('=== 서버 상태 확인 완료 ===')
  }

  // 파일 업로드 처리
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('=== 파일 업로드 시작 ===')
    console.log('파일 정보:', file.name, file.size, file.type)

    // 모든 상태 초기화
    setAudioFile(file)
    setTranscribedText("")
    setDisplayedText("")
    setRealTimeText("") // 실시간 텍스트도 초기화
    setSummary("")
    setScript("")
    setTranscriptionError("")
    setSummaryError("")
    setScriptError("")
    setRiskError("")
    setRiskAnalysis({
      riskLevel: 0,
      riskStage: "정상",
      emotion: "",
      analysis: ""
    })
    setRealTimeRiskLevel(0)
    setRealTimeRiskStage("정상")
    setIsTranscribing(false)
    setIsTyping(false)
    setIsPlaying(false)
    setIsRealTimeTranscribing(false)
    disconnectWebSocket()
    stopAudioStream()

    console.log('상태 초기화 완료')

    // 오디오 URL 생성
    const url = URL.createObjectURL(file)
    setAudioUrl(url)

    // 오디오 메타데이터 설정
    if (audioRef.current) {
      audioRef.current.src = url
      audioRef.current.load()
      console.log('오디오 요소 설정 완료')
    }

    console.log('=== 파일 업로드 완료 ===')
  }

  // 텍스트를 점진적으로 표시하는 함수
  const typeTextProgressively = (fullText: string) => {
    console.log('=== typeTextProgressively 시작 ===')
    console.log('전체 텍스트:', fullText)
    console.log('현재 재생 상태:', isPlaying)
    
    if (!fullText.trim()) return
    
    setIsTyping(true)
    setDisplayedText("")
    
    let currentIndex = 0
    const totalLength = fullText.length
    
    const typeNextChar = () => {
      if (currentIndex < totalLength) {
        setDisplayedText(fullText.substring(0, currentIndex + 1))
        currentIndex++
        setTimeout(typeNextChar, typingSpeed)
      } else {
        setIsTyping(false)
        console.log('=== typeTextProgressively 완료 ===')
        
        // 텍스트 표시 완료 후 요약과 스크립트 생성
        console.log('요약과 스크립트 생성 시작')
        generateSummaryAndScript(fullText)
      }
    }
    
    typeNextChar()
  }

  // 음성을 텍스트로 변환하는 함수
  const transcribeAudio = async (file: File) => {
    console.log('=== transcribeAudio 시작 ===')
    console.log('파일:', file.name, file.size)
    
    setIsTranscribing(true)
    setTranscriptionError("")
    
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
        setTranscribedText(data.text)
        console.log('음성 변환 완료:', data.text)
        
        // 음성 변환이 완료되면 항상 점진적 표시 시작
        console.log('음성 변환 완료 후 점진적 표시 시작')
        typeTextProgressively(data.text)
      } else {
        throw new Error('음성 변환에 실패했습니다.')
      }
    } catch (error) {
      console.error('음성 변환 오류:', error)
      setTranscriptionError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsTranscribing(false)
      console.log('=== transcribeAudio 완료 ===')
    }
  }

  // 텍스트를 요약하는 함수
  const summarizeText = async (text: string) => {
    console.log('📝 === summarizeText 시작 ===')
    console.log('요약할 텍스트:', text.substring(0, 100) + '...')
    
    if (!text.trim()) {
      console.log('텍스트가 비어있어서 요약 건너뜀')
      return null
    }
    
    // 텍스트가 너무 짧으면 요약하지 않음
    if (text.trim().length < 10) {
      console.log('텍스트가 너무 짧아서 요약 건너뜀')
      return null
    }
    
    setIsSummarizing(true)
    setSummaryError("")
    
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
        if (response.status === 404) {
          throw new Error('백엔드 서버가 실행되지 않았습니다. 서버를 먼저 실행해주세요.')
        }
        if (response.status === 500) {
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
        setSummary(data.summary)
        return data.summary
      } else {
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
      
      setSummaryError(errorMessage)
      return null
    } finally {
      setIsSummarizing(false)
      console.log('📝 === summarizeText 완료 ===')
    }
  }

  // 스크립트를 생성하는 함수
  const generateScript = async (text: string) => {
    console.log('=== generateScript 시작 ===')
    if (!text.trim()) return
    
    setIsGeneratingScript(true)
    setScriptError("")
    
    try {
      console.log('스크립트 API 호출 시작...')
      const response = await fetch('http://localhost:8000/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })
      
      console.log('스크립트 API 응답 상태:', response.status, response.ok)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('백엔드 서버가 실행되지 않았습니다. 서버를 먼저 실행해주세요.')
        }
        throw new Error(`서버 오류: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('스크립트 API 응답 데이터:', data)
      
      if (data.success) {
        console.log('스크립트 생성 완료:', data.script)
        setScript(data.script)
        return data.script
      } else {
        throw new Error('스크립트 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('스크립트 생성 오류:', error)
      setScriptError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
      return null
    } finally {
      setIsGeneratingScript(false)
      console.log('=== generateScript 완료 ===')
    }
  }

  // 요약과 스크립트를 동시에 생성하는 함수
  const generateSummaryAndScript = async (text: string) => {
    console.log('=== generateSummaryAndScript 시작 ===')
    console.log('입력 텍스트:', text)
    
    if (!text.trim()) {
      console.log('텍스트가 비어있어서 요약/스크립트 생성 건너뜀')
      return
    }
    
    // 텍스트가 너무 짧으면 요약하지 않음
    if (text.trim().length < 10) {
      console.log('텍스트가 너무 짧아서 요약/스크립트 생성 건너뜀')
      return
    }
    
    console.log('텍스트 길이:', text.trim().length, '자')
    
    // 각각 독립적으로 실행하여 하나가 실패해도 다른 것이 실행되도록 함
    try {
      // 위험도 분석
      console.log('위험도 분석 시작...')
      const riskResult = await analyzeRisk(text)
      if (riskResult) {
        console.log('위험도 분석 결과:', riskResult.riskStage, riskResult.riskLevel)
        setRealTimeRiskLevel(riskResult.riskLevel)
        setRealTimeRiskStage(riskResult.riskStage)
      }
    } catch (error) {
      console.error('위험도 분석 오류:', error)
    }
    
    try {
      // 요약 생성 - 강제로 실행
      console.log('요약 생성 시작...')
      const summaryResult = await summarizeText(text)
      if (summaryResult) {
        console.log('요약 생성 완료:', summaryResult)
        setSummary(summaryResult)
      } else {
        console.log('요약 생성 실패: 결과가 null')
      }
    } catch (error) {
      console.error('요약 생성 오류:', error)
    }
    
    try {
      // 스크립트 생성
      console.log('스크립트 생성 시작...')
      const scriptResult = await generateScript(text)
      if (scriptResult) {
        console.log('스크립트 생성 완료:', scriptResult)
        setScript(scriptResult)
      }
    } catch (error) {
      console.error('스크립트 생성 오류:', error)
    }
    
    console.log('=== generateSummaryAndScript 완료 ===')
  }

  // analyzeRisk 함수를 useCallback으로 감싸기
  const analyzeRisk = useCallback(async (text: string) => {
    console.log('=== analyzeRisk 시작 ===')
    if (!text.trim()) return null
    
    setIsAnalyzingRisk(true)
    setRiskError("")
    
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
        setRiskAnalysis(result)
        console.log('위험도 분석 완료:', data.risk_stage, data.risk_level)
        return result
      } else {
        throw new Error('위험도 분석에 실패했습니다.')
      }
    } catch (error) {
      console.error('위험도 분석 오류:', error)
      setRiskError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
      return null
    } finally {
      setIsAnalyzingRisk(false)
      console.log('=== analyzeRisk 완료 ===')
    }
  }, [])

  // 실시간 위험도 분석 강제 시작
  const forceStartRiskAnalysis = useCallback(() => {
    console.log('🚀 실시간 위험도 분석 강제 시작')
    
    // 재생 중이 아니면 분석하지 않음
    if (!isPlaying) {
      console.log('⏸️ 재생 중이 아니므로 강제 분석 건너뜀')
      return
    }
    
    const currentText = realTimeText || displayedText
    if (currentText && currentText.length > 5) {
      console.log('🔍 강제 위험도 분석 실행:', currentText.substring(0, 50) + '...')
      
      // 즉시 위험도 분석 실행
      analyzeRisk(currentText).then((result) => {
        if (result) {
          console.log('🎯 강제 위험도 분석 결과:', result.riskStage, result.riskLevel)
          
          // 실시간 위험도 상태 업데이트
          setRealTimeRiskLevel(result.riskLevel)
          setRealTimeRiskStage(result.riskStage)
          
          // 위험도에 따른 즉시 차단
          if (result.riskStage === "위험") {
            console.log('🚨 위험 단계 감지: 즉시 차단 시작')
            
            // 오디오 강제 정지
            if (audioRef.current) {
              audioRef.current.pause()
              audioRef.current.currentTime = 0
              audioRef.current.volume = 0
              console.log('🔇 오디오 강제 정지 완료')
            }
            
            // 재생 상태 변경
            setIsPlaying(false)
            console.log('⏹️ 재생 상태 변경 완료')
            
            // 미디어 레코더 정지
            if (mediaRecorder && mediaRecorder.state === 'recording') {
              mediaRecorder.stop()
              setMediaRecorder(null)
              console.log('🎤 미디어 레코더 정지 완료')
            }
            
            // 실시간 처리 중단
            setIsRealTimeTranscribing(false)
            setIsTyping(false)
            console.log('🛑 실시간 처리 중단 완료')
            
            // 웹소켓 연결 해제
            disconnectWebSocket()
            stopAudioStream()
            console.log('🔌 웹소켓 연결 해제 완료')
            
            console.log('🚨 위험 단계 차단 완료!')
            
          } else if (result.riskStage === "경고") {
            console.log('⚠️ 경고 단계 감지: 음성 차단 시작')
            
            // 오디오 강제 정지
            if (audioRef.current) {
              audioRef.current.pause()
              audioRef.current.currentTime = 0
              audioRef.current.volume = 0
              console.log('🔇 오디오 강제 정지 완료')
            }
            
            // 재생 상태 변경
            setIsPlaying(false)
            console.log('⏹️ 재생 상태 변경 완료')
            
            // 미디어 레코더 정지
            if (mediaRecorder && mediaRecorder.state === 'recording') {
              mediaRecorder.stop()
              setMediaRecorder(null)
              console.log('🎤 미디어 레코더 정지 완료')
            }
            
            // 실시간 음성 처리만 중단
            setIsRealTimeTranscribing(false)
            console.log('🛑 실시간 음성 처리 중단 완료')
            
            // 웹소켓 연결 해제
            disconnectWebSocket()
            stopAudioStream()
            console.log('🔌 웹소켓 연결 해제 완료')
            
            console.log('⚠️ 경고 단계 차단 완료!')
          }
        }
      }).catch(error => {
        console.error('❌ 강제 위험도 분석 오류:', error)
      })
    } else {
      console.log('📝 강제 분석할 텍스트가 부족함')
    }
  }, [realTimeText, displayedText, analyzeRisk, isPlaying])

  // 재생/일시정지 토글
  const togglePlayPause = async () => {
    console.log('=== togglePlayPause 시작 ===')
    
    if (!audioFile) {
      console.log('오디오 파일이 없습니다.')
      return
    }
    
    if (isPlaying) {
      // 일시정지
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setIsPlaying(false)
      setIsTyping(false)
      disconnectWebSocket()
      stopAudioStream()
      console.log('오디오 일시정지 및 웹소켓 연결 해제')
    } else {
      // 재생 시작
      console.log('오디오 재생 시작')
      setIsPlaying(true)
      
      // 웹소켓 연결
      connectWebSocket()
      
      // 실시간 음성 스트리밍 시작
      startAudioStream()
      
      // 즉시 위험도 분석 시작 (1초 후)
      setTimeout(() => {
        forceStartRiskAnalysis()
      }, 1000)
      
      // 백업용 음성 변환 (실시간이 실패할 경우를 대비)
      if (!transcribedText) {
        console.log('백업용 음성 변환 시작...')
        await transcribeAudio(audioFile)
      } else if (!displayedText) {
        // 이미 변환된 텍스트가 있으면 점진적 표시 시작
        console.log('기존 텍스트 점진적 표시 시작')
        typeTextProgressively(transcribedText)
      }
      
      // 오디오 재생
      if (audioRef.current) {
        audioRef.current.play()
      }
    }
  }

  // 오디오 시간 업데이트
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime)
    }
  }

  // 오디오 메타데이터 로드
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration)
    }
  }

  // 볼륨 변경
  const handleVolumeChange = (value: number[]) => {
    setVolume(value)
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100
    }
  }

  // 시간 포맷팅
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 파형 데이터 생성
  const generateWaveformData = () => {
    return Array.from({ length: 120 }).map((_, i) => {
      // 더 자연스러운 파동을 위한 사인파 기반 높이 계산
      const baseHeight = 30 + Math.sin(i * 0.2) * 20 + Math.sin(i * 0.5) * 15 + Math.sin(i * 0.8) * 10
      // 서버와 클라이언트 간 일관성을 위해 고정된 값 사용
      const randomVariation = isPlaying ? (i % 3) * 5 : 0
      const height = baseHeight + randomVariation
      
      return {
        height: Math.max(10, Math.min(70, height)),
        isCurrent: false,
        isActive: false,
        opacity: 0.8
      }
    })
  }

  const waveformData = generateWaveformData()

  const getRiskColor = (level: number) => {
    if (level < 30) return 'text-green-600'
    if (level < 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRiskBgColor = (level: number) => {
    if (level < 30) return 'bg-green-50 border-green-600'
    if (level < 70) return 'bg-yellow-50 border-yellow-600'
    return 'bg-red-50 border-red-600'
  }

  // 웹소켓 연결 함수
  const connectWebSocket = () => {
    console.log('=== 웹소켓 연결 시작 ===')
    try {
      const ws = new WebSocket('ws://localhost:8000/ws/real-time-analysis')
      
      ws.onopen = () => {
        console.log('웹소켓 연결됨')
        setIsWsConnected(true)
        setWsConnection(ws)
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('웹소켓 메시지 수신:', data)
          
          if (data.type === 'risk_analysis') {
            // 실시간 위험도 분석 결과 처리
            setRealTimeRiskLevel(data.risk_level)
            setRealTimeRiskStage(data.risk_stage)
            
            // 위험도가 높아지면 전체 위험도 분석 상태도 업데이트
            if (data.risk_level > riskAnalysis.riskLevel) {
              setRiskAnalysis({
                riskLevel: data.risk_level,
                riskStage: data.risk_stage,
                emotion: data.emotion,
                analysis: data.analysis
              })
            }
            
            console.log(`실시간 위험도 업데이트: ${data.risk_stage} (${data.risk_level}점)`)
          } else if (data.type === 'pong') {
            console.log('웹소켓 연결 상태 확인됨')
          } else if (data.type === 'error') {
            console.error('웹소켓 오류:', data.error)
          }
        } catch (error) {
          console.error('웹소켓 메시지 파싱 오류:', error)
        }
      }
      
      ws.onclose = () => {
        console.log('웹소켓 연결 해제됨')
        setIsWsConnected(false)
        setWsConnection(null)
      }
      
      ws.onerror = (error) => {
        console.error('웹소켓 오류:', error)
        setIsWsConnected(false)
        setWsConnection(null)
      }
      
    } catch (error) {
      console.error('웹소켓 연결 실패:', error)
      setIsWsConnected(false)
    }
  }

  // 웹소켓 연결 해제 함수
  const disconnectWebSocket = () => {
    if (wsConnection) {
      wsConnection.close()
      setWsConnection(null)
      setIsWsConnected(false)
      console.log('웹소켓 연결 해제됨')
    }
  }

  // 웹소켓 연결 대기 함수
  const waitForWebSocketConnection = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (isWsConnected) {
        resolve()
        return
      }
      
      const maxAttempts = 10
      let attempts = 0
      
      const checkConnection = () => {
        attempts++
        if (isWsConnected) {
          resolve()
        } else if (attempts >= maxAttempts) {
          reject(new Error('웹소켓 연결 시간 초과'))
        } else {
          setTimeout(checkConnection, 500)
        }
      }
      
      checkConnection()
    })
  }

  // 실시간 텍스트 청크를 웹소켓으로 전송하는 함수
  const sendTextChunkForAnalysis = async (textChunk: string, chunkId: number) => {
    try {
      await waitForWebSocketConnection()
      
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        const message = {
          type: 'text_chunk',
          text: textChunk,
          chunk_id: chunkId
        }
        
        wsConnection.send(JSON.stringify(message))
        console.log(`텍스트 청크 전송: ${chunkId} - "${textChunk}"`)
      }
    } catch (error) {
      console.error('텍스트 청크 전송 실패:', error)
    }
  }

  // 실시간 위험도 분석 (주기적)
  const startRealTimeRiskAnalysis = () => {
    console.log('실시간 위험도 분석 시작')
    
    // 1초마다 현재 텍스트로 위험도 분석
    const interval = setInterval(() => {
      const currentText = realTimeText || displayedText
      if (currentText && currentText.length > 5) {
        console.log('실시간 위험도 분석 실행:', currentText.substring(0, 50) + '...')
        
        // 위험도 분석 실행
        analyzeRisk(currentText).then((result) => {
          if (result) {
            console.log('실시간 위험도 분석 결과:', result.riskStage, result.riskLevel)
            
            // 실시간 위험도 상태 업데이트
            setRealTimeRiskLevel(result.riskLevel)
            setRealTimeRiskStage(result.riskStage)
            
            // 위험도에 따른 즉시 차단
            if (result.riskStage === "위험") {
              console.log('🚨 위험 단계 감지: 음성과 텍스트 차단 시작')
              
              // 1. 오디오 즉시 정지 (강제)
              if (audioRef.current) {
                try {
                  audioRef.current.pause()
                  audioRef.current.currentTime = 0
                  audioRef.current.volume = 0
                  console.log('✅ 오디오 정지 완료')
                } catch (error) {
                  console.error('오디오 정지 실패:', error)
                }
              }
              
              // 2. 재생 상태 즉시 변경
              setIsPlaying(false)
              console.log('✅ 재생 상태 변경 완료')
              
              // 3. 미디어 레코더 정지
              if (mediaRecorder) {
                try {
                  if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop()
                    console.log('✅ 미디어 레코더 정지 완료')
                  }
                } catch (error) {
                  console.error('미디어 레코더 정지 실패:', error)
                }
                setMediaRecorder(null)
              }
              
              // 4. 실시간 처리 중단
              setIsRealTimeTranscribing(false)
              setIsTyping(false)
              console.log('✅ 실시간 처리 중단 완료')
              
              // 5. 웹소켓 연결 해제
              try {
                disconnectWebSocket()
                stopAudioStream()
                console.log('✅ 웹소켓 연결 해제 완료')
              } catch (error) {
                console.error('웹소켓 해제 실패:', error)
              }
              
              console.log('🚨 위험 단계 차단 완료')
              
            } else if (result.riskStage === "경고") {
              console.log('⚠️ 경고 단계 감지: 음성 차단 시작')
              
              // 1. 오디오 즉시 정지 (강제)
              if (audioRef.current) {
                try {
                  audioRef.current.pause()
                  audioRef.current.currentTime = 0
                  audioRef.current.volume = 0
                  console.log('✅ 오디오 정지 완료')
                } catch (error) {
                  console.error('오디오 정지 실패:', error)
                }
              }
              
              // 2. 재생 상태 즉시 변경
              setIsPlaying(false)
              console.log('✅ 재생 상태 변경 완료')
              
              // 3. 미디어 레코더 정지
              if (mediaRecorder) {
                try {
                  if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop()
                    console.log('✅ 미디어 레코더 정지 완료')
                  }
                } catch (error) {
                  console.error('미디어 레코더 정지 실패:', error)
                }
                setMediaRecorder(null)
              }
              
              // 4. 실시간 음성 처리만 중단
              setIsRealTimeTranscribing(false)
              console.log('✅ 실시간 음성 처리 중단 완료')
              
              // 5. 웹소켓 연결 해제
              try {
                disconnectWebSocket()
                stopAudioStream()
                console.log('✅ 웹소켓 연결 해제 완료')
              } catch (error) {
                console.error('웹소켓 해제 실패:', error)
              }
              
              console.log('⚠️ 경고 단계 차단 완료')
            }
          }
        }).catch(error => {
          console.error('실시간 위험도 분석 오류:', error)
        })
      }
    }, 1000)
    
    // 컴포넌트 언마운트 시 정리
    return () => clearInterval(interval)
  }

  // 오디오 재생 종료 처리
  const onEnded = () => {
    console.log('오디오 재생 종료')
    
    // 모든 상태 초기화
    setIsPlaying(false)
    setIsTyping(false)
    setIsRealTimeTranscribing(false)
    
    // 웹소켓 연결 해제
    disconnectWebSocket()
    stopAudioStream()
    
    // 실시간 위험도 분석 중단을 위한 플래그 설정
    setRealTimeRiskLevel(0)
    setRealTimeRiskStage("정상")
    
    // 미디어 레코더 정리
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      setMediaRecorder(null)
    }
    
    console.log('모든 실시간 처리 중단 완료')
  }

  // 실시간 음성 스트리밍 웹소켓 연결
  const connectAudioStreamWebSocket = () => {
    console.log('=== 실시간 음성 스트리밍 웹소켓 연결 시작 ===')
    try {
      const ws = new WebSocket('ws://localhost:8000/ws/audio-stream')
      
      ws.onopen = () => {
        console.log('실시간 음성 스트리밍 웹소켓 연결됨')
        setIsRealTimeTranscribing(true)
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('실시간 음성 변환 결과:', data)
          
          if (data.type === 'transcription') {
            // 실시간 텍스트 업데이트 (중복 및 불필요한 텍스트 방지)
            setRealTimeText(prev => {
              const newText = data.text.trim()
              
              // 불필요한 텍스트 필터링
              const filteredText = newText.replace(/시청해주셔서 감사합니다\.?/g, '')
                                         .replace(/감사합니다\.?/g, '')
                                         .replace(/고맙습니다\.?/g, '')
                                         .trim()
              
              if (filteredText && filteredText.length > 1 && !prev.includes(filteredText)) {
                const updatedText = prev ? prev + ' ' + filteredText : filteredText
                
                // 텍스트 업데이트 후 즉시 위험도 분석
                if (updatedText.length > 5) {
                  console.log('실시간 텍스트 업데이트 - 즉시 위험도 분석 트리거:', updatedText.substring(0, 50) + '...')
                  
                  // 즉시 위험도 분석 실행
                  setTimeout(() => {
                    console.log('실시간 텍스트 기반 즉시 위험도 분석 시작:', updatedText.substring(0, 50) + '...')
                    analyzeRisk(updatedText).then((result) => {
                      if (result) {
                        console.log('실시간 텍스트 기반 위험도 분석 결과:', result.riskStage, result.riskLevel)
                        
                        // 실시간 위험도 상태 업데이트
                        setRealTimeRiskLevel(result.riskLevel)
                        setRealTimeRiskStage(result.riskStage)
                        
                        // 위험도에 따른 즉시 차단
                        if (result.riskStage === "위험") {
                          console.log('🚨 위험 단계 감지: 음성과 텍스트 차단 시작')
                          
                          // 오디오 즉시 정지
                          if (audioRef.current) {
                            audioRef.current.pause()
                            audioRef.current.currentTime = 0
                            audioRef.current.volume = 0
                            console.log('✅ 오디오 정지 완료')
                          }
                          setIsPlaying(false)
                          
                          // 미디어 레코더 정지
                          if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                            mediaRecorder.stop()
                            console.log('✅ 미디어 레코더 정지 완료')
                          }
                          setMediaRecorder(null)
                          
                          // 실시간 처리 중단
                          setIsRealTimeTranscribing(false)
                          setIsTyping(false)
                          
                          // 웹소켓 연결 해제
                          disconnectWebSocket()
                          stopAudioStream()
                          
                        } else if (result.riskStage === "경고") {
                          console.log('⚠️ 경고 단계 감지: 음성 차단 시작')
                          
                          // 오디오 즉시 정지
                          if (audioRef.current) {
                            audioRef.current.pause()
                            audioRef.current.currentTime = 0
                            audioRef.current.volume = 0
                            console.log('✅ 오디오 정지 완료')
                          }
                          setIsPlaying(false)
                          
                          // 미디어 레코더 정지
                          if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                            mediaRecorder.stop()
                            console.log('✅ 미디어 레코더 정지 완료')
                          }
                          setMediaRecorder(null)
                          
                          // 실시간 음성 처리만 중단
                          setIsRealTimeTranscribing(false)
                          
                          // 웹소켓 연결 해제
                          disconnectWebSocket()
                          stopAudioStream()
                        }
                      }
                    }).catch(error => {
                      console.error('실시간 위험도 분석 오류:', error)
                    })
                  }, 100) // 100ms 후 즉시 실행
                }
                
                return updatedText
              }
              return prev
            })
            console.log('실시간 텍스트 업데이트:', data.text)
          } else if (data.type === 'error') {
            console.error('실시간 음성 변환 오류:', data.message)
          }
        } catch (error) {
          console.error('실시간 음성 변환 메시지 파싱 오류:', error)
        }
      }
      
      ws.onclose = () => {
        console.log('실시간 음성 스트리밍 웹소켓 연결 해제됨')
        setIsRealTimeTranscribing(false)
      }
      
      ws.onerror = (error) => {
        console.error('실시간 음성 스트리밍 웹소켓 오류:', error)
        setIsRealTimeTranscribing(false)
      }
      
    } catch (error) {
      console.error('실시간 음성 스트리밍 웹소켓 연결 실패:', error)
      setIsRealTimeTranscribing(false)
    }
  }

  // 오디오 스트림 시작
  const startAudioStream = async () => {
    try {
      console.log('오디오 스트림 시작...')
      
      // 마이크 권한 요청
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      })
      
      // MediaRecorder 설정
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      // 실시간 음성 스트리밍 웹소켓 연결
      const audioWs = new WebSocket('ws://localhost:8000/ws/audio-stream')
      
      audioWs.onopen = () => {
        console.log('실시간 음성 스트리밍 웹소켓 연결됨')
        setIsRealTimeTranscribing(true)
      }
      
      audioWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('실시간 음성 변환 결과:', data)
          
          if (data.type === 'transcription') {
            // 실시간 텍스트 업데이트 (중복 및 불필요한 텍스트 방지)
            setRealTimeText(prev => {
              const newText = data.text.trim()
              
              // 불필요한 텍스트 필터링
              const filteredText = newText.replace(/시청해주셔서 감사합니다\.?/g, '')
                                         .replace(/감사합니다\.?/g, '')
                                         .replace(/고맙습니다\.?/g, '')
                                         .trim()
              
              if (filteredText && filteredText.length > 1 && !prev.includes(filteredText)) {
                const updatedText = prev ? prev + ' ' + filteredText : filteredText
                
                // 텍스트 업데이트 후 즉시 위험도 분석 및 요약
                if (updatedText.length > 10) {
                  setTimeout(() => {
                    // 위험도 분석
                    analyzeRisk(updatedText).then((result) => {
                      if (result) {
                        console.log('실시간 텍스트 기반 위험도 분석:', result.riskStage, result.riskLevel)
                        handleRiskLevelChange(result.riskLevel, result.riskStage)
                      }
                    }).catch(error => {
                      console.error('실시간 위험도 분석 오류:', error)
                    })
                    
                    // 요약 생성 (아직 요약이 없거나 텍스트가 변경된 경우)
                    if (!summary || summary.length === 0) {
                      console.log('실시간 텍스트 기반 요약 시작:', updatedText.substring(0, 50) + '...')
                      summarizeText(updatedText).then((result) => {
                        if (result) {
                          console.log('실시간 요약 완료:', result)
                        }
                      }).catch(error => {
                        console.error('실시간 요약 오류:', error)
                      })
                    }
                  }, 100)
                }
                
                return updatedText
              }
              return prev
            })
            console.log('실시간 텍스트 업데이트:', data.text)
          } else if (data.type === 'error') {
            console.error('실시간 음성 변환 오류:', data.message)
          }
        } catch (error) {
          console.error('실시간 음성 변환 메시지 파싱 오류:', error)
        }
      }
      
      audioWs.onclose = () => {
        console.log('실시간 음성 스트리밍 웹소켓 연결 해제됨')
        setIsRealTimeTranscribing(false)
      }
      
      audioWs.onerror = (error) => {
        console.error('실시간 음성 스트리밍 웹소켓 오류:', error)
        setIsRealTimeTranscribing(false)
      }
      
      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          console.log('오디오 청크 수집:', event.data.size, 'bytes')
          
          // 웹소켓으로 오디오 청크 전송
          if (audioWs.readyState === WebSocket.OPEN) {
            try {
              // Blob을 ArrayBuffer로 변환
              const arrayBuffer = await event.data.arrayBuffer()
              audioWs.send(arrayBuffer)
              console.log('오디오 청크 전송 완료:', event.data.size, 'bytes')
            } catch (error) {
              console.error('오디오 청크 전송 실패:', error)
            }
          } else {
            console.log('웹소켓이 연결되지 않아 청크 전송 건너뜀')
          }
        }
      }
      
      recorder.onstop = async () => {
        console.log('오디오 스트림 종료')
        audioWs.close()
        // 스트림 정리
        stream.getTracks().forEach(track => track.stop())
      }
      
      // 2초마다 청크 전송 (더 빠른 반응을 위해)
      recorder.start(2000)
      setMediaRecorder(recorder)
      
      console.log('오디오 스트림 시작 완료')
      
    } catch (error) {
      console.error('오디오 스트림 시작 실패:', error)
    }
  }

  // 오디오 스트림 중지
  const stopAudioStream = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setMediaRecorder(null)
      setIsRealTimeTranscribing(false)
      console.log('오디오 스트림 중지')
    }
  }

  // 위험도에 따른 음성 차단 처리
  const handleRiskLevelChange = (newRiskLevel: number, newRiskStage: string) => {
    console.log(`위험도 변경: ${newRiskLevel}점 (${newRiskStage})`)
    
    // 실시간 위험도 상태 업데이트
    setRealTimeRiskLevel(newRiskLevel)
    setRealTimeRiskStage(newRiskStage)
    
    if (newRiskStage === "위험") {
      // 위험 단계: 음성과 텍스트 모두 차단
      console.log('위험 단계 감지: 음성과 텍스트 차단')
      if (audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
      }
      if (mediaRecorder) {
        mediaRecorder.stop()
        setMediaRecorder(null)
      }
      setIsRealTimeTranscribing(false)
      setIsTyping(false)
    } else if (newRiskStage === "경고") {
      // 경고 단계: 음성만 차단
      console.log('경고 단계 감지: 음성 차단')
      if (audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
      }
      if (mediaRecorder) {
        mediaRecorder.stop()
        setMediaRecorder(null)
      }
      setIsRealTimeTranscribing(false)
    }
  }

  // 실시간 위험도 분석 useEffect - 완전히 새로 작성
  useEffect(() => {
    console.log('🔍 실시간 위험도 분석 useEffect 실행:', { 
      isPlaying, 
      realTimeTextLength: realTimeText?.length, 
      displayedTextLength: displayedText?.length,
      realTimeRiskStage
    })
    
    // 재생 중이고 텍스트가 있을 때만 분석 시작
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
    const performRiskAnalysis = async () => {
      try {
        const result = await analyzeRisk(currentText)
        if (result) {
          console.log('🎯 위험도 분석 결과:', result.riskStage, result.riskLevel)
          
          // 실시간 위험도 상태 업데이트
          setRealTimeRiskLevel(result.riskLevel)
          setRealTimeRiskStage(result.riskStage)
          
          // 위험도에 따른 즉시 차단
          if (result.riskStage === "위험") {
            console.log('🚨 위험 단계 감지: 즉시 차단 시작')
            
            // 오디오 강제 정지
            if (audioRef.current) {
              audioRef.current.pause()
              audioRef.current.currentTime = 0
              audioRef.current.volume = 0
              console.log('🔇 오디오 강제 정지 완료')
            }
            
            // 재생 상태 변경
            setIsPlaying(false)
            console.log('⏹️ 재생 상태 변경 완료')
            
            // 미디어 레코더 정지
            if (mediaRecorder && mediaRecorder.state === 'recording') {
              mediaRecorder.stop()
              setMediaRecorder(null)
              console.log('🎤 미디어 레코더 정지 완료')
            }
            
            // 실시간 처리 중단
            setIsRealTimeTranscribing(false)
            setIsTyping(false)
            console.log('🛑 실시간 처리 중단 완료')
            
            // 웹소켓 연결 해제
            disconnectWebSocket()
            stopAudioStream()
            console.log('🔌 웹소켓 연결 해제 완료')
            
            console.log('🚨 위험 단계 차단 완료!')
            
          } else if (result.riskStage === "경고") {
            console.log('⚠️ 경고 단계 감지: 음성 차단 시작')
            
            // 오디오 강제 정지
            if (audioRef.current) {
              audioRef.current.pause()
              audioRef.current.currentTime = 0
              audioRef.current.volume = 0
              console.log('🔇 오디오 강제 정지 완료')
            }
            
            // 재생 상태 변경
            setIsPlaying(false)
            console.log('⏹️ 재생 상태 변경 완료')
            
            // 미디어 레코더 정지
            if (mediaRecorder && mediaRecorder.state === 'recording') {
              mediaRecorder.stop()
              setMediaRecorder(null)
              console.log('🎤 미디어 레코더 정지 완료')
            }
            
            // 실시간 음성 처리만 중단
            setIsRealTimeTranscribing(false)
            console.log('🛑 실시간 음성 처리 중단 완료')
            
            // 웹소켓 연결 해제
            disconnectWebSocket()
            stopAudioStream()
            console.log('🔌 웹소켓 연결 해제 완료')
            
            console.log('⚠️ 경고 단계 차단 완료!')
          }
        }
      } catch (error) {
        console.error('❌ 위험도 분석 오류:', error)
      }
    }
    
    // 즉시 분석 실행
    performRiskAnalysis()
    
    // 2초마다 반복 분석
    const interval = setInterval(() => {
      if (!isPlaying) {
        console.log('⏸️ 재생 중지로 인한 분석 중단')
        clearInterval(interval)
        return
      }
      
      const updatedText = realTimeText || displayedText
      if (updatedText && updatedText.length >= 5) {
        console.log('🔄 주기적 위험도 분석 실행')
        performRiskAnalysis()
      }
    }, 2000)
    
    // 클린업
    return () => {
      clearInterval(interval)
      console.log('🧹 위험도 분석 인터벌 정리')
    }
  }, [isPlaying, realTimeText, displayedText, analyzeRisk])

  // 오디오 이벤트 리스너 설정
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // 위험도에 따른 오디오 차단 함수
    const blockAudio = () => {
      console.log('🔇 오디오 차단 이벤트 실행')
      audio.pause()
      audio.currentTime = 0
      audio.volume = 0
      setIsPlaying(false)
    }

    // 위험도 상태 변경 시 오디오 차단
    if (realTimeRiskStage === "위험" || realTimeRiskStage === "경고") {
      blockAudio()
    }

    // 오디오 재생 시도 시 차단
    const handlePlayAttempt = () => {
      if (realTimeRiskStage === "위험" || realTimeRiskStage === "경고") {
        console.log('🔇 재생 시도 차단됨')
        blockAudio()
      }
    }

    audio.addEventListener('play', handlePlayAttempt)
    audio.addEventListener('playing', handlePlayAttempt)

    return () => {
      audio.removeEventListener('play', handlePlayAttempt)
      audio.removeEventListener('playing', handlePlayAttempt)
    }
  }, [realTimeRiskStage])

  // 실시간 텍스트 변경 시 요약 시도
  useEffect(() => {
    const currentText = realTimeText || displayedText
    
    if (currentText && currentText.trim().length >= 10 && !isSummarizing && !summary) {
      console.log('🔄 실시간 텍스트 변경 감지 - 요약 시도:', currentText.substring(0, 50) + '...')
      
      // 3초 후에 요약 시도 (텍스트가 안정화된 후)
      const timeoutId = setTimeout(() => {
        console.log('📝 실시간 텍스트 기반 요약 시작')
        summarizeText(currentText).then((result) => {
          if (result) {
            console.log('✅ 실시간 요약 완료:', result)
          } else {
            console.log('❌ 실시간 요약 실패: 결과가 null')
          }
        }).catch(error => {
          console.error('❌ 실시간 요약 오류:', error)
        })
      }, 3000)
      
      return () => clearTimeout(timeoutId)
    }
  }, [realTimeText, displayedText, isSummarizing, summary])

  // 더미 텍스트로 요약 테스트 (개발용)
  useEffect(() => {
    // 10초 후에 더미 텍스트로 요약 테스트
    const timeoutId = setTimeout(() => {
      if (!summary && !isSummarizing) {
        const dummyText = "고객이 카드 할인에 대해 문의하고 있습니다. 할인 혜택이 제대로 적용되지 않아서 불만을 표현하고 있으며, 해결책을 요구하고 있습니다. 카드사에서 할인 혜택을 사전에 알려주지 않아서 고객이 혜택을 놓쳤다고 불만을 토로하고 있습니다."
        console.log('🧪 더미 텍스트로 요약 테스트 시작')
        summarizeText(dummyText)
      }
    }, 10000)
    
    return () => clearTimeout(timeoutId)
  }, [summary, isSummarizing])



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={onEnded}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-green-600">
            <Heart className="h-6 w-6 animate-pulse" />
            <span className="text-xl font-bold">Mallang</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            className={`${
              serverStatus === 'connected' 
                ? 'text-green-600 border-green-600 bg-green-50' 
                : serverStatus === 'checking'
                ? 'text-yellow-600 border-yellow-600 bg-yellow-50'
                : 'text-red-600 border-red-600 bg-red-50'
            }`}
          >
            {serverStatus === 'connected' ? (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                서버 연결됨
              </>
            ) : serverStatus === 'checking' ? (
              <>
                <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-yellow-600 border-t-transparent"></div>
                연결 확인 중
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-1" />
                서버 연결 안됨
              </>
            )}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 max-w-6xl mx-auto">
        {/* Audio Waveform Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Volume2 className="h-5 w-5 text-blue-600" />
              <span>실시간 음성 분석</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg p-4 border shadow-sm">
              {/* Audio Waveform Visualization */}
              <div className="relative h-32 bg-white rounded-lg overflow-hidden border border-gray-300">
                {/* Waveform bars */}
                <div className="flex items-end justify-between h-full px-2 py-2">
                  {waveformData.map((bar, i) => (
                    <div
                      key={i}
                      className={`bg-gray-500 transition-all duration-100 ${isPlaying ? 'animate-pulse' : ''}`}
                      style={{
                        width: '1px',
                        height: `${bar.height}%`,
                        opacity: bar.opacity
                      }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Timeline and Controls */}
              <div className="mt-2">
                {/* Bottom Controls */}
                <div className="flex items-center justify-between">
                  {/* Left: Upload Button */}
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="audio-file-bottom" className="cursor-pointer">
                      <div className="p-2 rounded-lg border border-gray-300 hover:border-blue-500 transition-colors bg-white">
                        <Upload className="h-4 w-4 text-gray-600" />
                      </div>
                    </Label>
                    <Input
                      id="audio-file-bottom"
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {audioFile && (
                      <span className="text-xs text-gray-500">{audioFile.name}</span>
                    )}
                  </div>
                  
                  {/* Center: Play Button */}
                  <div className="flex items-center">
                    {audioUrl && (
                      <button
                        onClick={togglePlayPause}
                        className="p-3 rounded-full border border-gray-300 hover:border-blue-500 transition-colors bg-white shadow-sm"
                      >
                        {isPlaying ? (
                          <Pause className="h-5 w-5 text-gray-600" />
                        ) : (
                          <Play className="h-5 w-5 text-gray-600" />
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Right: Time Display */}
                  <div className="text-sm text-gray-600">
                    {audioUrl ? `${formatTime(audioCurrentTime)} / ${formatTime(audioDuration)}` : '0:00 / 0:00'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Text Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-lg font-semibold">실시간 텍스트</CardTitle>
              <div className="flex items-center space-x-2">
                {realTimeRiskStage !== "정상" && (
                  <Badge 
                    variant={realTimeRiskStage === "위험" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {realTimeRiskStage === "위험" ? "음성/텍스트 차단됨" : "음성 차단됨"}
                  </Badge>
                )}
                {isPlaying && (
                  <Badge variant="outline" className="text-xs text-green-600">
                    실시간 분석 중
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  지연율 {latency}ms
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[100px] border-l-4 border-blue-500">
              {realTimeText ? (
                <div>
                  <p className="text-gray-800 leading-relaxed">
                    {realTimeRiskStage === "위험" ? (
                      <span className="text-red-600 font-bold text-lg">🚨 위험 단계로 인해 텍스트가 차단되었습니다.</span>
                    ) : realTimeRiskStage === "경고" ? (
                      <div>
                        <p className="text-gray-800">{realTimeText}</p>
                        <p className="text-yellow-600 text-sm mt-2">⚠️ 경고 단계: 음성이 차단되었습니다.</p>
                      </div>
                    ) : (
                      realTimeText
                    )}
                    {isRealTimeTranscribing && realTimeRiskStage === "정상" && <span className="animate-pulse">|</span>}
                  </p>
                  {isRealTimeTranscribing && realTimeRiskStage === "정상" && (
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-500">실시간 변환 중...</span>
                    </div>
                  )}
                  {realTimeRiskStage === "경고" && (
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-yellow-600">음성 차단됨</span>
                    </div>
                  )}
                  {realTimeRiskStage === "위험" && (
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-red-600">음성 및 텍스트 차단됨</span>
                    </div>
                  )}
                </div>
              ) : displayedText ? (
                <div>
                  <p className="text-gray-800 leading-relaxed">
                    {realTimeRiskStage === "위험" ? (
                      <span className="text-red-600 font-bold text-lg">🚨 위험 단계로 인해 텍스트가 차단되었습니다.</span>
                    ) : (
                      displayedText
                    )}
                    {isTyping && realTimeRiskStage === "정상" && <span className="animate-pulse">|</span>}
                  </p>
                  {isTyping && realTimeRiskStage === "정상" && (
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-500">실시간 변환 중...</span>
                    </div>
                  )}
                  {realTimeRiskStage === "위험" && (
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-red-600">음성 및 텍스트 차단됨</span>
                    </div>
                  )}
                </div>
              ) : transcribedText ? (
                <div className="text-gray-400 text-sm">
                  재생 버튼을 클릭하면 텍스트가 표시됩니다.
                </div>
              ) : (
                <div className="text-gray-400 text-sm">
                  음성 파일을 업로드하면 텍스트로 변환됩니다.
                </div>
              )}
              {!isTranscribing && !isTyping && !isRealTimeTranscribing && (displayedText || realTimeText) && realTimeRiskStage !== "위험" && (
                <div className="mt-2 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-500">변환 완료</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI 대화 내용 요약 */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">AI 대화 내용 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isSummarizing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500">AI가 대화 내용을 분석하고 요약 중...</span>
                </div>
              ) : summaryError ? (
                <div className="space-y-2">
                  <div className="text-red-600 text-sm">
                    오류: {summaryError}
                  </div>
                  {(displayedText || realTimeText) && (
                    <Button 
                      onClick={() => {
                        const currentText = realTimeText || displayedText || transcribedText
                        if (currentText && currentText.trim().length >= 10) {
                          console.log('재시도 요약 시작:', currentText.substring(0, 50) + '...')
                          summarizeText(currentText)
                        }
                      }}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                    >
                      다시 시도
                    </Button>
                  )}
                </div>
              ) : summary ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">AI 분석 완료</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                      {summary}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-gray-400 text-sm">
                    음성 파일을 업로드하면 AI가 내용을 분석하고 요약합니다.
                  </div>
                  {serverStatus === 'disconnected' && (
                    <div className="text-red-500 text-xs bg-red-50 p-2 rounded border border-red-200">
                      ⚠️ 백엔드 서버가 연결되지 않았습니다. AI 요약 기능을 사용하려면 서버를 먼저 실행해주세요.
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Response Script Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span>추천 대응 스크립트</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
              {isGeneratingScript ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-yellow-600">AI가 맞춤형 상담 스크립트를 생성 중...</span>
                </div>
              ) : scriptError ? (
                <div className="text-red-600 text-sm">
                  스크립트 생성 오류: {scriptError}
                </div>
              ) : script ? (
                <div className="space-y-3">
                  <div className="text-yellow-800 leading-relaxed">
                    {script.split('\n').map((line, index) => (
                      <p key={index} className="mb-2">
                        {line}
                      </p>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-yellow-600">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                    <span>AI 스크립트 생성 완료</span>
                  </div>
                </div>
              ) : displayedText ? (
                <div className="text-yellow-600 text-sm">
                  음성 내용을 바탕으로 한 맞춤형 응답을 생성 중입니다...
                </div>
              ) : (
                <div className="text-yellow-600 text-sm">
                  음성 파일을 업로드하면 AI가 맞춤형 상담 스크립트를 생성합니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 실시간 위험도 분석 */}
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">실시간 위험도 분석</CardTitle>
              <div className="flex items-center space-x-2">
                {isPlaying && (
                  <Badge variant="outline" className="text-xs text-green-600">
                    실시간 분석 중
                  </Badge>
                )}
                <Badge variant={realTimeRiskStage === "정상" ? "default" : realTimeRiskStage === "경고" ? "secondary" : "destructive"}>
                  {realTimeRiskStage}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">위험도 점수</span>
                <span className="text-lg font-bold">{realTimeRiskLevel}점</span>
              </div>
              
              <Progress value={realTimeRiskLevel} className="w-full" />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">감정 상태</span>
                  <p className="font-medium">{riskAnalysis.emotion || "분석 중..."}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">분석 상태</span>
                  <p className="font-medium">{isPlaying ? "실시간 분석 중..." : "대기 중"}</p>
                </div>
              </div>
              
              {riskAnalysis.analysis && (
                <div>
                  <span className="text-sm text-gray-500">분석 내용</span>
                  <p className="text-sm mt-1">{riskAnalysis.analysis}</p>
                </div>
              )}
              
              {!isPlaying && realTimeRiskLevel === 0 && (
                <div className="text-gray-400 text-sm">
                  음성 파일을 재생하면 실시간으로 위험도를 분석합니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
