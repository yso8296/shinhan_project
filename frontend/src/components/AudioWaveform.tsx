import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Play, Pause, Volume2 } from "lucide-react"
import { AudioState } from "@/types/audio"

interface AudioWaveformProps {
  audioState: AudioState
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onTogglePlayPause: () => void
  formatTime: (time: number) => string
}

export const AudioWaveform = ({ 
  audioState, 
  onFileUpload, 
  onTogglePlayPause, 
  formatTime 
}: AudioWaveformProps) => {
  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50 overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Volume2 className="h-5 w-5 text-blue-600" />
          </div>
          <span className="font-semibold">음성 파일 업로드</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 파일 업로드 영역 */}
          <div className="border-2 border-dashed border-blue-200 rounded-xl p-8 text-center hover:border-blue-300 transition-all duration-300 hover:bg-blue-50/50">
            <input
              type="file"
              accept="audio/*"
              onChange={onFileUpload}
              className="hidden"
              id="audio-upload"
            />
            <label htmlFor="audio-upload" className="cursor-pointer">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-blue-700 font-semibold text-lg">음성 파일을 선택하거나 드래그하세요</p>
                  <p className="text-blue-500 text-sm mt-1">MP3, WAV, M4A 등 지원</p>
                </div>
              </div>
            </label>
          </div>

          {/* 파일 정보 및 컨트롤 */}
          {audioState.file && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-blue-800 text-lg">{audioState.file.name}</h3>
                  <p className="text-blue-600 text-sm mt-1">
                    {formatTime(audioState.currentTime)} / {formatTime(audioState.duration)}
                  </p>
                </div>
                <Button
                  onClick={onTogglePlayPause}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {audioState.isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      일시정지
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      재생
                    </>
                  )}
                </Button>
              </div>

              {/* 진행 바 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-blue-600">
                  <span>진행률</span>
                  <span>{Math.round((audioState.currentTime / audioState.duration) * 100)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 shadow-sm"
                    style={{ width: `${(audioState.currentTime / audioState.duration) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 상태 메시지 */}
          {!audioState.file && (
            <div className="text-center text-blue-600 bg-blue-50 rounded-lg p-4">
              <p className="font-medium">음성 파일을 업로드하여 AI 분석을 시작하세요</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 