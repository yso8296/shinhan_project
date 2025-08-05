import { Card, CardContent } from "@/components/ui/card"
import { Server, ServerOff, Wifi, WifiOff } from "lucide-react"
import { ServerState } from "@/types/audio"

interface HeaderProps {
  serverState: ServerState
}

export const Header = ({ serverState }: HeaderProps) => {
  return (
    <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white overflow-hidden relative">
      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-800/20"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* 신한은행 로고 */}
            <div className="relative">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AI 상담사 정서 케어 시스템</h1>
              <p className="text-blue-100 text-sm font-medium">신한은행 고객 상담 품질 관리 솔루션</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* 서버 상태 */}
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                {serverState.status === 'connected' ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-300" />
                    <span className="text-green-300 text-sm font-medium">서버 연결됨</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-300" />
                    <span className="text-red-300 text-sm font-medium">서버 연결 안됨</span>
                  </>
                )}
              </div>
              
              <div className="w-px h-4 bg-white/20"></div>
              
              <div className="flex items-center space-x-2">
                {serverState.status === 'connected' ? (
                  <>
                    <Server className="h-4 w-4 text-green-300" />
                    <span className="text-green-300 text-sm font-medium">정상</span>
                  </>
                ) : (
                  <>
                    <ServerOff className="h-4 w-4 text-red-300" />
                    <span className="text-red-300 text-sm font-medium">오류</span>
                  </>
                )}
              </div>
            </div>
            
            {/* 실시간 상태 표시 */}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/80 text-sm font-medium">실시간 모니터링</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 