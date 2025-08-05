import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Shield, AlertTriangle, CheckCircle } from "lucide-react"
import { RiskAnalysisState } from "@/types/audio"

interface RiskAnalysisProps {
  riskAnalysisState: RiskAnalysisState
  isPlaying: boolean
}

export const RiskAnalysis = ({ riskAnalysisState, isPlaying }: RiskAnalysisProps) => {
  const { realTimeRiskLevel, realTimeRiskStage, emotion, analysis } = riskAnalysisState

  const getRiskColor = (stage: string) => {
    switch (stage) {
      case "위험":
        return "text-red-600 bg-red-50 border-red-200"
      case "경고":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "정상":
        return "text-green-600 bg-green-50 border-green-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getRiskIcon = (stage: string) => {
    switch (stage) {
      case "위험":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case "경고":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "정상":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      default:
        return <Shield className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-red-50 overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          <div className="p-2 bg-red-100 rounded-lg">
            <Shield className="h-5 w-5 text-red-600" />
          </div>
          <span className="font-semibold">실시간 위험도 분석</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 위험도 레벨 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-blue-800">위험도 레벨</span>
              <span className="text-2xl font-bold text-blue-800">{realTimeRiskLevel}점</span>
            </div>
            <Progress value={realTimeRiskLevel} className="h-3" />
            <div className="flex justify-between text-xs text-blue-600 mt-2">
              <span>정상</span>
              <span>경고</span>
              <span>위험</span>
            </div>
          </div>

          {/* 위험도 단계 */}
          <div className={`rounded-xl p-6 border shadow-sm ${getRiskColor(realTimeRiskStage)}`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-white/50 rounded-lg">
                {getRiskIcon(realTimeRiskStage)}
              </div>
              <span className="font-semibold text-lg">현재 단계: {realTimeRiskStage}</span>
            </div>
            {emotion && (
              <div className="mb-3 p-3 bg-white/50 rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">감정 상태:</span> {emotion}
                </p>
              </div>
            )}
            {analysis && (
              <div className="p-3 bg-white/50 rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">분석:</span> {analysis}
                </p>
              </div>
            )}
          </div>

          {/* 재생 상태 */}
          <div className="flex items-center space-x-3 text-sm text-blue-600 bg-blue-100 rounded-lg px-4 py-3">
            <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="font-medium">{isPlaying ? '실시간 분석 중' : '분석 대기 중'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 