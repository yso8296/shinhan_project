// 웹소켓 연결 함수
export const connectWebSocket = (
  onMessage: (data: any) => void,
  onOpen?: () => void,
  onClose?: () => void,
  onError?: (error: Event) => void
): WebSocket => {
  console.log('=== 웹소켓 연결 시작 ===')
  try {
    const ws = new WebSocket('ws://localhost:8000/ws/real-time-analysis')
    
    ws.onopen = () => {
      console.log('웹소켓 연결됨')
      onOpen?.()
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('웹소켓 메시지 수신:', data)
        onMessage(data)
      } catch (error) {
        console.error('웹소켓 메시지 파싱 오류:', error)
      }
    }
    
    ws.onclose = () => {
      console.log('웹소켓 연결 해제됨')
      onClose?.()
    }
    
    ws.onerror = (error) => {
      console.error('웹소켓 오류:', error)
      onError?.(error)
    }
    
    return ws
  } catch (error) {
    console.error('웹소켓 연결 실패:', error)
    throw error
  }
}

// 실시간 음성 스트리밍 웹소켓 연결
export const connectAudioStreamWebSocket = (
  onTranscription: (text: string) => void,
  onError: (error: string) => void,
  onOpen?: () => void,
  onClose?: () => void
): WebSocket => {
  console.log('=== 실시간 음성 스트리밍 웹소켓 연결 시작 ===')
  try {
    const ws = new WebSocket('ws://localhost:8000/ws/audio-stream')
    
    ws.onopen = () => {
      console.log('실시간 음성 스트리밍 웹소켓 연결됨')
      onOpen?.()
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('실시간 음성 변환 결과:', data)
        
        if (data.type === 'transcription') {
          onTranscription(data.text)
        } else if (data.type === 'error') {
          onError(data.message)
        }
      } catch (error) {
        console.error('실시간 음성 변환 메시지 파싱 오류:', error)
      }
    }
    
    ws.onclose = () => {
      console.log('실시간 음성 스트리밍 웹소켓 연결 해제됨')
      onClose?.()
    }
    
    ws.onerror = (error) => {
      console.error('실시간 음성 스트리밍 웹소켓 오류:', error)
    }
    
    return ws
  } catch (error) {
    console.error('실시간 음성 스트리밍 웹소켓 연결 실패:', error)
    throw error
  }
}

// 웹소켓 연결 대기 함수
export const waitForWebSocketConnection = (ws: WebSocket): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (ws.readyState === WebSocket.OPEN) {
      resolve()
      return
    }
    
    const maxAttempts = 10
    let attempts = 0
    
    const checkConnection = () => {
      attempts++
      if (ws.readyState === WebSocket.OPEN) {
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
export const sendTextChunkForAnalysis = async (
  ws: WebSocket, 
  textChunk: string, 
  chunkId: number
): Promise<void> => {
  try {
    await waitForWebSocketConnection(ws)
    
    if (ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'text_chunk',
        text: textChunk,
        chunk_id: chunkId
      }
      
      ws.send(JSON.stringify(message))
      console.log(`텍스트 청크 전송: ${chunkId} - "${textChunk}"`)
    }
  } catch (error) {
    console.error('텍스트 청크 전송 실패:', error)
  }
} 