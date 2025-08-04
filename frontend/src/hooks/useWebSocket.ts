import { useState, useRef, useCallback } from 'react'
import { WebSocketState } from '@/types/audio'
import { connectWebSocket, connectAudioStreamWebSocket } from '@/utils/websocket'

export const useWebSocket = () => {
  const [webSocketState, setWebSocketState] = useState<WebSocketState>({
    connection: null,
    isConnected: false
  })

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)

  // 웹소켓 연결 함수
  const connectWebSocketConnection = useCallback((
    onMessage: (data: any) => void,
    onOpen?: () => void,
    onClose?: () => void,
    onError?: (error: Event) => void
  ) => {
    try {
      const ws = connectWebSocket(
        onMessage,
        () => {
          setWebSocketState({ connection: ws, isConnected: true })
          onOpen?.()
        },
        () => {
          setWebSocketState({ connection: null, isConnected: false })
          onClose?.()
        },
        onError
      )
    } catch (error) {
      console.error('웹소켓 연결 실패:', error)
      setWebSocketState({ connection: null, isConnected: false })
    }
  }, [])

  // 웹소켓 연결 해제 함수
  const disconnectWebSocket = useCallback(() => {
    if (webSocketState.connection) {
      webSocketState.connection.close()
      setWebSocketState({ connection: null, isConnected: false })
      console.log('웹소켓 연결 해제됨')
    }
  }, [webSocketState.connection])

  // 오디오 스트림 시작
  const startAudioStream = useCallback(async (
    onTranscription: (text: string) => void,
    onError: (error: string) => void
  ) => {
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
      const audioWs = connectAudioStreamWebSocket(
        onTranscription,
        onError,
        () => console.log('실시간 음성 스트리밍 웹소켓 연결됨'),
        () => console.log('실시간 음성 스트리밍 웹소켓 연결 해제됨')
      )
      
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
  }, [])

  // 오디오 스트림 중지
  const stopAudioStream = useCallback(() => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setMediaRecorder(null)
      console.log('오디오 스트림 중지')
    }
  }, [mediaRecorder])

  return {
    webSocketState,
    mediaRecorder,
    connectWebSocketConnection,
    disconnectWebSocket,
    startAudioStream,
    stopAudioStream
  }
} 