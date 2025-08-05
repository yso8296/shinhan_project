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
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-indigo-50 overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          <div className="p-2 bg-blue-100 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-blue-600" />
          </div>
          <span className="font-semibold">추천 대응 스크립트</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-sm">
          {isGeneratingScript ? (
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-blue-600 font-medium">AI가 맞춤형 상담 스크립트를 생성 중...</span>
            </div>
          ) : scriptError ? (
            <div className="text-red-600 text-sm bg-red-50 rounded-lg p-4">
              스크립트 생성 오류: {scriptError}
            </div>
          ) : script ? (
            <div className="space-y-4">
              <div className="text-blue-800 leading-relaxed bg-white rounded-lg p-4 border border-blue-200">
                {script.split('\n').map((line, index) => (
                  <p key={index} className="mb-3 text-lg">
                    {line}
                  </p>
                ))}
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-100 rounded-lg px-4 py-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium">AI 스크립트 생성 완료</span>
              </div>
            </div>
          ) : displayedText ? (
            <div className="text-center text-blue-600 bg-blue-50 rounded-lg p-6">
              <p className="font-medium">음성 내용을 바탕으로 한 맞춤형 응답을 생성 중입니다...</p>
            </div>
          ) : (
            <div className="text-center text-blue-600 bg-blue-50 rounded-lg p-6">
              <p className="font-medium">음성 파일을 업로드하면 AI가 맞춤형 상담 스크립트를 생성합니다.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 