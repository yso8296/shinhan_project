import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Volume2, Upload, Play, Pause } from "lucide-react"
import { generateWaveformData } from "@/utils/audio"
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
  const waveformData = generateWaveformData(audioState.isPlaying)

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Volume2 className="h-5 w-5 text-blue-600" />
          <span>실시간 음성 분석</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-white rounded-lg p-4 border shadow-sm">
          {/* Audio Waveform Visualization */}
          <div className="relative h-32 bg-white rounded-lg overflow-hidden border border-gray-300">
            {/* Waveform bars */}
            <div className="flex items-end justify-between h-full px-2 py-2">
              {waveformData.map((bar, i) => (
                <div
                  key={i}
                  className={`bg-gray-500 transition-all duration-100 ${audioState.isPlaying ? 'animate-pulse' : ''}`}
                  style={{
                    width: '1px',
                    height: `${bar.height}%`,
                    opacity: bar.opacity
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* Timeline and Controls */}
          <div className="mt-2">
            {/* Bottom Controls */}
            <div className="flex items-center justify-between">
              {/* Left: Upload Button */}
              <div className="flex items-center space-x-2">
                <Label htmlFor="audio-file-bottom" className="cursor-pointer">
                  <div className="p-2 rounded-lg border border-gray-300 hover:border-blue-500 transition-colors bg-white">
                    <Upload className="h-4 w-4 text-gray-600" />
                  </div>
                </Label>
                <Input
                  id="audio-file-bottom"
                  type="file"
                  accept="audio/*"
                  onChange={onFileUpload}
                  className="hidden"
                />
                {audioState.file && (
                  <span className="text-xs text-gray-500">{audioState.file.name}</span>
                )}
              </div>
              
              {/* Center: Play Button */}
              <div className="flex items-center">
                {audioState.url && (
                  <button
                    onClick={onTogglePlayPause}
                    className="p-3 rounded-full border border-gray-300 hover:border-blue-500 transition-colors bg-white shadow-sm"
                  >
                    {audioState.isPlaying ? (
                      <Pause className="h-5 w-5 text-gray-600" />
                    ) : (
                      <Play className="h-5 w-5 text-gray-600" />
                    )}
                  </button>
                )}
              </div>
              
              {/* Right: Time Display */}
              <div className="text-sm text-gray-600">
                {audioState.url ? `${formatTime(audioState.currentTime)} / ${formatTime(audioState.duration)}` : '0:00 / 0:00'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 