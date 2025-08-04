import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, AlertCircle, BarChart3, AlertTriangle } from "lucide-react"
import { AIAnalysisState, ServerState } from "@/types/audio"

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
  
  // 무한 렌더링 방지를 위해 디버그 로그 제거
  // console.log('🔍 AISummary 컴포넌트 렌더링:', {
  //   summary: summary,
  //   isSummarizing: isSummarizing,
  //   summaryError: summaryError,
  //   summaryLength: summary?.length,
  //   serverStatus: serverState.status,
  //   hasSummary: !!summary,
  //   summaryType: typeof summary
  // })

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">AI 대화 내용 요약</CardTitle>
          <div className="flex items-center space-x-2">
            {isSummarizing && (
              <Badge variant="outline" className="text-xs text-blue-600">
                분석 중
              </Badge>
            )}
            {summary && (
              <Badge variant="outline" className="text-xs text-green-600">
                완료
              </Badge>
            )}
            {summaryError && (
              <Badge variant="outline" className="text-xs text-red-600">
                오류
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isSummarizing ? (
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-medium text-blue-800">AI가 대화 내용을 분석하고 요약 중...</p>
                <p className="text-xs text-blue-600">잠시만 기다려주세요</p>
              </div>
            </div>
          ) : summaryError ? (
            <div className="space-y-3">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">요약 처리 중 오류가 발생했습니다</p>
                    <p className="text-sm text-red-600 mt-1">{summaryError}</p>
                  </div>
                </div>
              </div>
                             {transcribedText && (
                 <div className="flex items-center space-x-2">
                   <Button 
                     onClick={onRetrySummary}
                     size="sm"
                     variant="outline"
                     className="text-xs"
                   >
                     요약 & 스크립트 재생성
                   </Button>
                   <Button 
                     onClick={() => {
                       if (transcribedText && transcribedText.trim().length >= 10) {
                         console.log('🔧 수동 요약 & 스크립트 버튼 클릭:', transcribedText.substring(0, 50) + '...')
                         onRetrySummary()
                       }
                     }}
                     size="sm"
                     variant="outline"
                     className="text-xs"
                     disabled={!transcribedText || transcribedText.trim().length < 10}
                   >
                     수동 요약 & 스크립트
                   </Button>
                   <span className="text-xs text-gray-500">
                     텍스트 길이: {transcribedText.length}자
                   </span>
                 </div>
               )}
            </div>
          ) : summary ? (
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-l-4 border-blue-500 shadow-sm">
                <div className="flex items-start space-x-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-blue-600 mt-0.5" />
                  <h4 className="text-sm font-medium text-blue-800">AI 대화 내용 요약</h4>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-line text-sm">
                    {summary}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-600">음성 파일을 업로드하면 AI가 내용을 분석하고 요약합니다.</p>
                </div>
              </div>
              {serverState.status === 'disconnected' && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">백엔드 서버 연결 안됨</p>
                      <p className="text-xs text-red-600 mt-1">
                        AI 요약 기능을 사용하려면 백엔드 서버를 먼저 실행해주세요.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 