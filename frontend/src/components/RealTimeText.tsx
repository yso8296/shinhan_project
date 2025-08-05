import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MicOff, AlertTriangle } from "lucide-react"
import { TranscriptionState } from "@/types/audio"

interface RealTimeTextProps {
  transcriptionState: TranscriptionState
  latency: number
  isBlocked?: boolean
}

export const RealTimeText = ({ transcriptionState, latency, isBlocked = false }: RealTimeTextProps) => {
  const { realTimeText, displayedText, isTranscribing } = transcriptionState

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {isBlocked ? (
            <>
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-600">실시간 텍스트 (차단됨)</span>
            </>
          ) : (
            <>
              {isTranscribing ? (
                <Mic className="h-5 w-5 text-green-600 animate-pulse" />
              ) : (
                <MicOff className="h-5 w-5 text-gray-400" />
              )}
              <span>실시간 텍스트</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          {isBlocked ? (
            <div className="text-red-600 text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <p className="text-lg font-semibold mb-2">위험 단계 감지</p>
              <p className="text-sm text-red-500">
                부적절한 내용이 감지되어 실시간 텍스트가 차단되었습니다.
              </p>
            </div>
          ) : isTranscribing ? (
            <div className="space-y-3">
              <div className="text-blue-800 leading-relaxed">
                {realTimeText ? (
                  realTimeText.split('\n').map((line, index) => (
                    <p key={index} className="mb-2">
                      {line}
                    </p>
                  ))
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-blue-600">실시간 음성 변환 중...</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-blue-600">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>실시간 변환 중</span>
                </div>
                <span>지연시간: {latency}ms</span>
              </div>
            </div>
          ) : displayedText ? (
            <div className="space-y-3">
              <div className="text-blue-800 leading-relaxed">
                {displayedText.split('\n').map((line, index) => (
                  <p key={index} className="mb-2">
                    {line}
                  </p>
                ))}
              </div>
              <div className="flex items-center space-x-2 text-xs text-blue-600">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>변환 완료</span>
              </div>
            </div>
          ) : (
            <div className="text-blue-600 text-sm">
              음성 파일을 재생하면 실시간으로 텍스트가 변환됩니다.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 