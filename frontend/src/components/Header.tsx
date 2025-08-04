import { Badge } from "@/components/ui/badge"
import { Heart, CheckCircle, AlertTriangle } from "lucide-react"
import { ServerState } from "@/types/audio"

interface HeaderProps {
  serverState: ServerState
}

export const Header = ({ serverState }: HeaderProps) => {
  return (
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
            serverState.status === 'connected' 
              ? 'text-green-600 border-green-600 bg-green-50' 
              : serverState.status === 'checking'
              ? 'text-yellow-600 border-yellow-600 bg-yellow-50'
              : 'text-red-600 border-red-600 bg-red-50'
          }`}
        >
          {serverState.status === 'connected' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-1" />
              서버 연결됨
            </>
          ) : serverState.status === 'checking' ? (
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
  )
} 