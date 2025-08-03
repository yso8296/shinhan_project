"use client";

import { Heart, Volume2, Shield, AlertTriangle, CheckCircle, Mic, MicOff, Settings, Bell, BarChart3, Upload, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [isRecording, setIsRecording] = useState(true);
  const [riskLevel, setRiskLevel] = useState(15);
  const [latency, setLatency] = useState(91);
  const [currentTime, setCurrentTime] = useState(0);
  const [autoProtection, setAutoProtection] = useState(true);
  const [sensitivity, setSensitivity] = useState([50]);
  const [showSettings, setShowSettings] = useState(false);
  
  // 음성파일 관련 상태
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [volume, setVolume] = useState([50]);
  
  // 텍스트 변환 관련 상태
  const [transcribedText, setTranscribedText] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState("");
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // 실시간 효과를 위한 useEffect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(prev => (prev + 0.1) % 180); // 3분(180초) 주기
      setLatency(prev => Math.max(50, Math.min(150, prev + (Math.random() - 0.5) * 10)));
      
      // 리스크 레벨 동적 변화 (실제 환경 시뮬레이션)
      if (Math.random() > 0.95) {
        setRiskLevel(prev => Math.min(100, prev + Math.random() * 10));
      } else if (Math.random() > 0.9) {
        setRiskLevel(prev => Math.max(0, prev - Math.random() * 5));
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // 오디오 파일 처리
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setIsPlaying(false);
      setAudioCurrentTime(0);
      setTranscribedText("");
      setTranscriptionError("");
      
      // 파일 업로드 시 자동으로 텍스트 변환 시작
      await transcribeAudio(file);
    }
  };

  // 음성 파일을 텍스트로 변환하는 함수
  const transcribeAudio = async (file: File) => {
    setIsTranscribing(true);
    setTranscriptionError("");
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:8000/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTranscribedText(data.text);
        console.log('음성 변환 완료:', data.text);
      } else {
        throw new Error('음성 변환에 실패했습니다.');
      }
    } catch (error) {
      console.error('음성 변환 오류:', error);
      setTranscriptionError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // 오디오 재생/일시정지
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // 오디오 시간 업데이트
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
    }
  };

  // 오디오 로드 완료
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  // 볼륨 조절
  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100;
    }
  };

  // 시간 포맷팅
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 오디오 웨이브폼 데이터 생성
  const generateWaveformData = () => {
    return Array.from({ length: 120 }).map((_, i) => {
      // 더 자연스러운 파동을 위한 사인파 기반 높이 계산
      const baseHeight = 30 + Math.sin(i * 0.2) * 20 + Math.sin(i * 0.5) * 15 + Math.sin(i * 0.8) * 10;
      const randomVariation = isPlaying ? Math.random() * 15 : 0;
      const height = baseHeight + randomVariation;
      
      return {
        height: Math.max(10, Math.min(70, height)),
        isCurrent: false,
        isActive: false,
        opacity: 0.8
      };
    });
  };

  const waveformData = generateWaveformData();

  const getRiskColor = (level: number) => {
    if (level < 30) return 'text-green-600';
    if (level < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBgColor = (level: number) => {
    if (level < 30) return 'bg-green-50 border-green-600';
    if (level < 70) return 'bg-yellow-50 border-yellow-600';
    return 'bg-red-50 border-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
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
              ) : transcribedText ? (
                <p className="text-gray-800 leading-relaxed">
                  {transcribedText}
                </p>
              ) : (
                <p className="text-gray-800 leading-relaxed">
                  안녕하세요, 이번 달 요금이 평소보다 훨씬 많이 나와서 문의드려요. 
                  제가 작년부터 썼는데 이래 많이 나온 거는 내 처음인데요. 
                  아니 근데...
                </p>
              )}
              <div className="mt-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500">
                  {isTranscribing ? '실시간 변환 중...' : '변환 완료'}
                </span>
              </div>
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
              <p className="text-blue-800 font-medium">
                {transcribedText ? '음성 파일 분석 완료' : '통신 요금 상승으로 인한 문의'}
              </p>
              <div className="mt-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-600">AI 분석 완료</span>
              </div>
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
              <p className="text-yellow-800 leading-relaxed font-medium">
                {transcribedText ? '음성 내용을 바탕으로 한 맞춤형 응답을 생성 중입니다.' : '먼저 고객님의 정보 확인을 위해서 성함과 생년월일을 알 수 있을까요?'}
              </p>
              <div className="mt-3 flex items-center space-x-2">
                <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                  신뢰도: 95%
                </Badge>
                <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                  추천도: 높음
                </Badge>
              </div>
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
  );
}
