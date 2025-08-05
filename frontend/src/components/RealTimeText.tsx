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
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-indigo-50 overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          {isBlocked ? (
            <>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-red-600 font-semibold">실시간 텍스트 (차단됨)</span>
            </>
          ) : (
            <>
              <div className="p-2 bg-blue-100 rounded-lg">
                {isTranscribing ? (
                  <Mic className="h-5 w-5 text-blue-600 animate-pulse" />
                ) : (
                  <MicOff className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <span className="font-semibold">실시간 텍스트 변환</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-sm">
          {isBlocked ? (
            <div className="text-red-600 text-center py-8">
              <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-xl font-semibold mb-2">위험 단계 감지</p>
              <p className="text-sm text-red-500">
                부적절한 내용이 감지되어 실시간 텍스트가 차단되었습니다.
              </p>
            </div>
          ) : isTranscribing ? (
            <div className="space-y-4">
              <div className="text-blue-800 leading-relaxed">
                {realTimeText ? (
                  realTimeText.split('\n').map((line, index) => (
                    <p key={index} className="mb-3 text-lg">
                      {line}
                    </p>
                  ))
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-blue-600 font-medium">실시간 음성 변환 중...</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-sm text-blue-600 bg-blue-100 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">실시간 변환 중</span>
                </div>
                <span className="font-mono">지연시간: {latency}ms</span>
              </div>
            </div>
          ) : displayedText ? (
            <div className="space-y-4">
              <div className="text-blue-800 leading-relaxed">
                {displayedText.split('\n').map((line, index) => (
                  <p key={index} className="mb-3 text-lg">
                    {line}
                  </p>
                ))}
              </div>
              <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-100 rounded-lg px-4 py-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">변환 완료</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-blue-600 bg-blue-50 rounded-lg p-6">
              <p className="font-medium">음성 파일을 재생하면 실시간으로 텍스트가 변환됩니다.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 