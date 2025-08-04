export interface AudioState {
  file: File | null
  url: string | null
  isPlaying: boolean
  duration: number
  currentTime: number
  volume: number[]
}

export interface TranscriptionState {
  transcribedText: string
  isTranscribing: boolean
  error: string
  displayedText: string
  isTyping: boolean
  realTimeText: string
  isRealTimeTranscribing: boolean
}

export interface AIAnalysisState {
  summary: string
  isSummarizing: boolean
  summaryError: string
  script: string
  isGeneratingScript: boolean
  scriptError: string
}

export interface RiskAnalysisState {
  riskLevel: number
  riskStage: string
  emotion: string
  analysis: string
  isAnalyzing: boolean
  error: string
  realTimeRiskLevel: number
  realTimeRiskStage: string
}

export interface WebSocketState {
  connection: WebSocket | null
  isConnected: boolean
}

export interface ServerState {
  status: 'checking' | 'connected' | 'disconnected'
}

export interface WaveformData {
  height: number
  isCurrent: boolean
  isActive: boolean
  opacity: number
} 