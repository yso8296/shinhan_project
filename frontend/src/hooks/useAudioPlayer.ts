import { useState, useRef, useCallback } from 'react'
import { AudioState } from '@/types/audio'
import { formatTime } from '@/utils/audio'

export const useAudioPlayer = () => {
  const [audioState, setAudioState] = useState<AudioState>({
    file: null,
    url: null,
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    volume: [50]
  })

  const audioRef = useRef<HTMLAudioElement>(null)

  // 파일 업로드 처리
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('=== 파일 업로드 시작 ===')
    console.log('파일 정보:', file.name, file.size, file.type)

    // 오디오 URL 생성
    const url = URL.createObjectURL(file)
    
    setAudioState(prev => ({
      ...prev,
      file,
      url,
      isPlaying: false,
      currentTime: 0,
      duration: 0
    }))

    // 오디오 메타데이터 설정
    if (audioRef.current) {
      audioRef.current.src = url
      audioRef.current.load()
      console.log('오디오 요소 설정 완료')
    }

    console.log('=== 파일 업로드 완료 ===')
  }, [])

  // 재생/일시정지 토글
  const togglePlayPause = useCallback(() => {
    if (!audioState.file) {
      console.log('오디오 파일이 없습니다.')
      return
    }

    if (audioState.isPlaying) {
      // 일시정지
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setAudioState(prev => ({ ...prev, isPlaying: false }))
      console.log('오디오 일시정지')
    } else {
      // 재생 시작
      console.log('오디오 재생 시작')
      setAudioState(prev => ({ ...prev, isPlaying: true }))
      
      // 오디오 재생
      if (audioRef.current) {
        audioRef.current.play()
      }
    }
  }, [audioState.file, audioState.isPlaying])

  // 오디오 시간 업데이트
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setAudioState(prev => ({ ...prev, currentTime: audioRef.current!.currentTime }))
    }
  }, [])

  // 오디오 메타데이터 로드
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setAudioState(prev => ({ ...prev, duration: audioRef.current!.duration }))
    }
  }, [])

  // 볼륨 변경
  const handleVolumeChange = useCallback((value: number[]) => {
    setAudioState(prev => ({ ...prev, volume: value }))
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100
    }
  }, [])

  // 오디오 재생 종료 처리
  const onEnded = useCallback(() => {
    console.log('오디오 재생 종료')
    setAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }))
  }, [])

  // 오디오 강제 정지
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.volume = 0
    }
    setAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }))
  }, [])

  return {
    audioState,
    audioRef,
    handleFileUpload,
    togglePlayPause,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleVolumeChange,
    onEnded,
    stopAudio,
    formatTime: (time: number) => formatTime(time)
  }
} 