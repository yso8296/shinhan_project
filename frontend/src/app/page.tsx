"use client"

import { useState, useEffect, useRef } from "react"
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

    setAudioFile(file)
    setTranscribedText("")
    setDisplayedText("")
    setSummary("")
    setScript("")
    setTranscriptionError("")
    setSummaryError("")
    setScriptError("")

    // 오디오 URL 생성
    const url = URL.createObjectURL(file)
    setAudioUrl(url)

    // 오디오 메타데이터 설정
    if (audioRef.current) {
      audioRef.current.src = url
      audioRef.current.load()
    }
  }

  // 텍스트 점진적 표시
  const typeTextProgressively = (fullText: string) => {
    console.log('텍스트 점진적 표시 시작:', fullText)
    console.log('현재 재생 상태:', isPlaying)
    
    setIsTyping(true)
    setDisplayedText("")
    
    let currentIndex = 0
    const totalLength = fullText.length
    
    const typeNextCharacter = () => {
      // 재생 상태와 관계없이 텍스트를 완전히 표시
      if (currentIndex < totalLength) {
        setDisplayedText(fullText.substring(0, currentIndex + 1))
        currentIndex++
        setTimeout(typeNextCharacter, typingSpeed)
      } else {
        setIsTyping(false)
        console.log('텍스트 표시 완료:', currentIndex, totalLength)
        
        // 텍스트 표시가 완료되면 요약과 스크립트 생성
        console.log('요약과 스크립트 생성 시작')
        setTimeout(async () => {
          await generateSummaryAndScript(fullText)
        }, 1000)
      }
    }
    
    typeNextCharacter()
  }

  // 음성 파일을 텍스트로 변환하는 함수
  const transcribeAudio = async (file: File) => {
    console.log('=== transcribeAudio 시작 ===')
    console.log('파일 정보:', file.name, file.size, file.type)
    
    setIsTranscribing(true)
    setTranscriptionError("")
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      console.log('백엔드 API 호출 시작...')
      const response = await fetch('http://localhost:8000/transcribe', {
        method: 'POST',
        body: formData,
      })
      
      console.log('백엔드 응답 상태:', response.status, response.ok)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('백엔드 서버가 실행되지 않았습니다. 서버를 먼저 실행해주세요.')
        }
        throw new Error(`서버 오류: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('백엔드 응답 데이터:', data)
      
      if (data.success) {
        setTranscribedText(data.text)
        console.log('음성 변환 완료:', data.text)
        
        // 점진적 텍스트 표시 시작 (이 함수 내부에서 요약과 스크립트 생성)
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
    console.log('=== summarizeText 시작 ===')
    if (!text.trim()) return
    
    setIsSummarizing(true)
    setSummaryError("")
    
    try {
      console.log('요약 API 호출 시작...')
      const response = await fetch('http://localhost:8000/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })
      
      console.log('요약 API 응답 상태:', response.status, response.ok)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('백엔드 서버가 실행되지 않았습니다. 서버를 먼저 실행해주세요.')
        }
        throw new Error(`서버 오류: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('요약 API 응답 데이터:', data)
      
      if (data.success) {
        setSummary(data.summary)
        console.log('요약 완료:', data.summary)
      } else {
        throw new Error('요약에 실패했습니다.')
      }
    } catch (error) {
      console.error('요약 오류:', error)
      setSummaryError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsSummarizing(false)
      console.log('=== summarizeText 완료 ===')
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
        setScript(data.script)
        console.log('스크립트 생성 완료:', data.script)
      } else {
        throw new Error('스크립트 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('스크립트 생성 오류:', error)
      setScriptError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
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
      console.log('텍스트가 비어있어서 처리하지 않습니다.')
      return
    }
    
    // 두 작업을 동시에 시작
    const summaryPromise = summarizeText(text)
    const scriptPromise = generateScript(text)
    
    // 두 작업이 모두 완료될 때까지 대기
    try {
      await Promise.all([summaryPromise, scriptPromise])
      console.log('요약과 스크립트 생성이 모두 완료되었습니다.')
    } catch (error) {
      console.error('요약 또는 스크립트 생성 중 오류:', error)
    }
    
    console.log('=== generateSummaryAndScript 완료 ===')
  }

  // 재생/일시정지 토글
  const togglePlayPause = async () => {
    if (!audioRef.current) return

    if (isPlaying) {
      console.log('재생 중단')
      audioRef.current.pause()
      setIsPlaying(false)
      // 재생 중단 시 타이핑 상태도 중단
      setIsTyping(false)
    } else {
      try {
        console.log('재생 시작')
        setIsPlaying(true) // 먼저 재생 상태를 true로 설정
        audioRef.current.play()
        
        // 재생 시작 시 음성 변환 시작
        if (audioFile && !transcribedText) {
          console.log('음성 변환 시작...')
          await transcribeAudio(audioFile)
        } else if (transcribedText && !displayedText) {
          // 이미 변환된 텍스트가 있지만 표시되지 않은 경우
          console.log('기존 텍스트 표시 시작')
          typeTextProgressively(transcribedText)
        }
      } catch (error) {
        console.error('오디오 재생 오류:', error)
        setIsPlaying(false)
        setTranscriptionError('오디오 재생 중 오류가 발생했습니다.')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false)
            setIsTyping(false)
          }}
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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <span>실시간 텍스트</span>
              </CardTitle>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="text-green-600 bg-green-50">
                  지연율 {latency.toFixed(0)}ms
                </Badge>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">리스크 감지 레벨</span>
                  <div className={`w-3 h-3 rounded-full ${
                    riskLevel < 30 ? 'bg-green-500' : 
                    riskLevel < 70 ? 'bg-yellow-500' : 'bg-red-500'
                  } animate-pulse`}></div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[100px] border-l-4 border-blue-500">
              {isTranscribing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500">음성을 텍스트로 변환 중...</span>
                </div>
              ) : transcriptionError ? (
                <div className="text-red-600 text-sm">
                  오류: {transcriptionError}
                </div>
              ) : displayedText ? (
                <div>
                  <p className="text-gray-800 leading-relaxed">
                    {displayedText}
                    {isTyping && <span className="animate-pulse">|</span>}
                  </p>
                  {isTyping && (
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-500">실시간 변환 중...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">
                  음성 파일을 업로드하면 텍스트로 변환됩니다.
                </div>
              )}
              {!isTranscribing && !isTyping && displayedText && (
                <div className="mt-2 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-500">변환 완료</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Summary Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>AI 대화 내용 요약</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              {isSummarizing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-600">AI가 내용을 분석하고 요약 중...</span>
                </div>
              ) : summaryError ? (
                <div className="text-red-600 text-sm">
                  요약 오류: {summaryError}
                </div>
              ) : summary ? (
                <div className="space-y-2">
                  <p className="text-blue-800 font-medium leading-relaxed">
                    {summary}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-blue-600">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>AI 분석 완료</span>
                  </div>
                </div>
              ) : (
                <div className="text-blue-400 text-sm">
                  음성 파일을 업로드하면 AI가 내용을 분석하고 요약합니다.
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

        {/* Risk Level Indicator */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>현재 리스크 레벨</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">안전</span>
                <span className="text-sm text-gray-600">주의</span>
                <span className="text-sm text-gray-600">위험</span>
              </div>
              <Progress 
                value={riskLevel} 
                className="h-3" 
                style={{
                  '--progress-background': riskLevel < 30 ? '#10b981' : 
                                          riskLevel < 70 ? '#f59e0b' : '#ef4444'
                } as React.CSSProperties}
              />
              <div className="flex justify-center">
                <Badge 
                  variant="outline" 
                  className={`${getRiskBgColor(riskLevel)} ${getRiskColor(riskLevel)}`}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {riskLevel < 30 ? '안전 단계' : 
                   riskLevel < 70 ? '주의 단계' : '위험 단계'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
