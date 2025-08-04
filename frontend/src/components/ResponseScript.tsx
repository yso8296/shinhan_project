import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { AIAnalysisState } from "@/types/audio"

interface ResponseScriptProps {
  aiAnalysisState: AIAnalysisState
  displayedText?: string
}

export const ResponseScript = ({ aiAnalysisState, displayedText }: ResponseScriptProps) => {
  const { script, isGeneratingScript, scriptError } = aiAnalysisState

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <span>추천 대응 스크립트</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
          {isGeneratingScript ? (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-yellow-600">AI가 맞춤형 상담 스크립트를 생성 중...</span>
            </div>
          ) : scriptError ? (
            <div className="text-red-600 text-sm">
              스크립트 생성 오류: {scriptError}
            </div>
          ) : script ? (
            <div className="space-y-3">
              <div className="text-yellow-800 leading-relaxed">
                {script.split('\n').map((line, index) => (
                  <p key={index} className="mb-2">
                    {line}
                  </p>
                ))}
              </div>
              <div className="flex items-center space-x-2 text-xs text-yellow-600">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                <span>AI 스크립트 생성 완료</span>
              </div>
            </div>
          ) : displayedText ? (
            <div className="text-yellow-600 text-sm">
              음성 내용을 바탕으로 한 맞춤형 응답을 생성 중입니다...
            </div>
          ) : (
            <div className="text-yellow-600 text-sm">
              음성 파일을 업로드하면 AI가 맞춤형 상담 스크립트를 생성합니다.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 