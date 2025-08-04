import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RiskAnalysisState } from "@/types/audio"

interface RiskAnalysisProps {
  riskAnalysisState: RiskAnalysisState
  isPlaying: boolean
}

export const RiskAnalysis = ({ riskAnalysisState, isPlaying }: RiskAnalysisProps) => {
  const { 
    realTimeRiskLevel, 
    realTimeRiskStage, 
    emotion, 
    analysis 
  } = riskAnalysisState

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">실시간 위험도 분석</CardTitle>
          <div className="flex items-center space-x-2">
            {isPlaying && (
              <Badge variant="outline" className="text-xs text-green-600">
                실시간 분석 중
              </Badge>
            )}
            <Badge variant={realTimeRiskStage === "정상" ? "default" : realTimeRiskStage === "경고" ? "secondary" : "destructive"}>
              {realTimeRiskStage}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">위험도 점수</span>
            <span className="text-lg font-bold">{realTimeRiskLevel}점</span>
          </div>
          
          <Progress value={realTimeRiskLevel} className="w-full" />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">감정 상태</span>
              <p className="font-medium">{emotion || "분석 중..."}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">분석 상태</span>
              <p className="font-medium">{isPlaying ? "실시간 분석 중..." : "대기 중"}</p>
            </div>
          </div>
          
          {analysis && (
            <div>
              <span className="text-sm text-gray-500">분석 내용</span>
              <p className="text-sm mt-1">{analysis}</p>
            </div>
          )}
          
          {!isPlaying && realTimeRiskLevel === 0 && (
            <div className="text-gray-400 text-sm">
              음성 파일을 재생하면 실시간으로 위험도를 분석합니다.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 