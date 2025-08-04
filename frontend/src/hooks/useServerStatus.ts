import { useState, useEffect } from 'react'
import { ServerState } from '@/types/audio'
import { checkServerStatus } from '@/utils/api'

export const useServerStatus = () => {
  const [serverState, setServerState] = useState<ServerState>({
    status: 'checking'
  })

  // 서버 상태 확인
  const checkServer = async () => {
    console.log('=== 서버 상태 확인 시작 ===')
    try {
      const status = await checkServerStatus()
      setServerState({ status })
      console.log('=== 서버 상태 확인 완료 ===')
    } catch (error) {
      console.error('서버 상태 확인 오류:', error)
      setServerState({ status: 'disconnected' })
    }
  }

  useEffect(() => {
    checkServer()
    
    // 주기적으로 서버 상태 확인 (30초마다)
    const interval = setInterval(() => {
      checkServer()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    serverState,
    checkServer
  }
} 