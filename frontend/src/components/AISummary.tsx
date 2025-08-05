import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { AIAnalysisState } from "@/types/audio"
import { ServerState } from "@/types/audio"

interface AISummaryProps {
  aiAnalysisState: AIAnalysisState
  serverState: ServerState
  onRetrySummary: () => void
  displayedText?: string
  realTimeText?: string
  transcribedText?: string
}

export const AISummary = ({ 
  aiAnalysisState, 
  serverState, 
  onRetrySummary,
  displayedText,
  realTimeText,
  transcribedText
}: AISummaryProps) => {
  const { summary, isSummarizing, summaryError } = aiAnalysisState

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50 overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <span className="font-semibold">AI 대화 내용 요약</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200 shadow-sm">
          {isSummarizing ? (
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-blue-600 font-medium">AI가 대화 내용을 요약 중...</span>
            </div>
          ) : summaryError ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-red-600 bg-red-50 rounded-lg p-4">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">요약 생성 오류: {summaryError}</span>
              </div>
              <Button 
                onClick={onRetrySummary}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                다시 시도
              </Button>
            </div>
          ) : summary ? (
            <div className="space-y-4">
              <div className="text-green-800 leading-relaxed bg-white rounded-lg p-4 border border-green-200">
                {summary.split('\n').map((line, index) => (
                  <p key={index} className="mb-3 text-lg">
                    {line}
                  </p>
                ))}
              </div>
              <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-100 rounded-lg px-4 py-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">AI 요약 완료</span>
              </div>
            </div>
          ) : (displayedText || realTimeText || transcribedText) ? (
            <div className="text-center text-blue-600 bg-blue-50 rounded-lg p-6">
              <p className="font-medium">음성 내용을 바탕으로 한 AI 요약을 생성 중입니다...</p>
            </div>
          ) : (
            <div className="text-center text-blue-600 bg-blue-50 rounded-lg p-6">
              <p className="font-medium">음성 파일을 업로드하면 AI가 대화 내용을 요약합니다.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 