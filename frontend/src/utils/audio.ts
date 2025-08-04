import { WaveformData } from '@/types/audio'

// 시간 포맷팅
export const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// 파형 데이터 생성
export const generateWaveformData = (isPlaying: boolean): WaveformData[] => {
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

// 위험도 색상 반환
export const getRiskColor = (level: number): string => {
  if (level < 30) return 'text-green-600'
  if (level < 70) return 'text-yellow-600'
  return 'text-red-600'
}

// 위험도 배경 색상 반환
export const getRiskBgColor = (level: number): string => {
  if (level < 30) return 'bg-green-50 border-green-600'
  if (level < 70) return 'bg-yellow-50 border-yellow-600'
  return 'bg-red-50 border-red-600'
} 