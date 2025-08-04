import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TranscriptionState } from "@/types/audio"

interface RealTimeTextProps {
  transcriptionState: TranscriptionState
  latency: number
}

export const RealTimeText = ({ transcriptionState, latency }: RealTimeTextProps) => {
  const { 
    realTimeText, 
    displayedText, 
    transcribedText, 
    isRealTimeTranscribing, 
    isTyping,
    realTimeRiskStage 
  } = transcriptionState

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg font-semibold">실시간 텍스트</CardTitle>
          <div className="flex items-center space-x-2">
            {realTimeRiskStage !== "정상" && (
              <Badge 
                variant={realTimeRiskStage === "위험" ? "destructive" : "secondary"}
                className="text-xs"
              >
                {realTimeRiskStage === "위험" ? "음성/텍스트 차단됨" : "음성 차단됨"}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              지연율 {latency}ms
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 rounded-lg p-4 min-h-[100px] border-l-4 border-blue-500">
          {realTimeText ? (
            <div>
              <p className="text-gray-800 leading-relaxed">
                {realTimeRiskStage === "위험" ? (
                  <span className="text-red-600 font-bold text-lg">🚨 위험 단계로 인해 텍스트가 차단되었습니다.</span>
                ) : realTimeRiskStage === "경고" ? (
                  <div>
                    <p className="text-gray-800">{realTimeText}</p>
                    <p className="text-yellow-600 text-sm mt-2">⚠️ 경고 단계: 음성이 차단되었습니다.</p>
                  </div>
                ) : (
                  realTimeText
                )}
                {isRealTimeTranscribing && realTimeRiskStage === "정상" && <span className="animate-pulse">|</span>}
              </p>
              {isRealTimeTranscribing && realTimeRiskStage === "정상" && (
                <div className="mt-2 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500">실시간 변환 중...</span>
                </div>
              )}
              {realTimeRiskStage === "경고" && (
                <div className="mt-2 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-yellow-600">음성 차단됨</span>
                </div>
              )}
              {realTimeRiskStage === "위험" && (
                <div className="mt-2 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-red-600">음성 및 텍스트 차단됨</span>
                </div>
              )}
            </div>
          ) : displayedText ? (
            <div>
              <p className="text-gray-800 leading-relaxed">
                {realTimeRiskStage === "위험" ? (
                  <span className="text-red-600 font-bold text-lg">🚨 위험 단계로 인해 텍스트가 차단되었습니다.</span>
                ) : (
                  displayedText
                )}
                {isTyping && realTimeRiskStage === "정상" && <span className="animate-pulse">|</span>}
              </p>
              {isTyping && realTimeRiskStage === "정상" && (
                <div className="mt-2 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500">실시간 변환 중...</span>
                </div>
              )}
              {realTimeRiskStage === "위험" && (
                <div className="mt-2 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-red-600">음성 및 텍스트 차단됨</span>
                </div>
              )}
            </div>
          ) : transcribedText ? (
            <div className="text-gray-400 text-sm">
              재생 버튼을 클릭하면 텍스트가 표시됩니다.
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              음성 파일을 업로드하면 텍스트로 변환됩니다.
            </div>
          )}
          {!isRealTimeTranscribing && !isTyping && (displayedText || realTimeText) && realTimeRiskStage !== "위험" && (
            <div className="mt-2 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-500">변환 완료</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 