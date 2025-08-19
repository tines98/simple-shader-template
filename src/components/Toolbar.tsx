import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Download,
  Upload,
  Triangle as Tri,
  Hash,
  Move,
  Pointer,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react"

export type DrawMode = "TRIANGLES" | "LINES" | "LINE_STRIP" | "POINTS"

interface Props {
  status: string
  error: string
  auto: boolean
  setAuto: (b: boolean) => void
  debounce: number
  setDebounce: (n: number) => void
  is2D: boolean
  setIs2D: (b: boolean) => void
  geomName: string
  setGeomName: (s: string) => void
  geomOptions: string[]
  drawMode: DrawMode
  setDrawMode: (m: DrawMode) => void
  scale: number
  setScale: (n: number) => void
  wire: boolean
  setWire: (b: boolean) => void
  points: boolean
  setPoints: (b: boolean) => void
  compile: () => void
  pauseResume: () => void
  isPaused: boolean
  reset: () => void
  download: () => void
  uploadOBJ: (f: File) => void
}

export function Toolbar({
  status,
  error,
  auto,
  setAuto,
  debounce,
  setDebounce,
  is2D,
  setIs2D,
  geomName,
  setGeomName,
  geomOptions,
  drawMode,
  setDrawMode,
  scale,
  setScale,
  wire,
  setWire,
  points,
  setPoints,
  compile,
  pauseResume,
  isPaused,
  reset,
  download,
  uploadOBJ,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={compile} className="gap-1">
        <Play className="h-4 w-4" />
        Compile
      </Button>
      <Button
        size="sm"
        variant={isPaused ? "outline" : "secondary"}
        onClick={pauseResume}
        className="gap-1"
      >
        {isPaused ? (
          <Play className="h-4 w-4" />
        ) : (
          <Pause className="h-4 w-4" />
        )}
        {isPaused ? "Resume" : "Pause"}
      </Button>
      <Button size="sm" variant="secondary" onClick={reset} className="gap-1">
        <RotateCcw className="h-4 w-4" />
        Reset
      </Button>

      <div className="ml-2 flex items-center gap-2">
        <Label htmlFor="auto">Auto</Label>
        <Switch id="auto" checked={auto} onCheckedChange={setAuto} />
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap">Debounce</Label>
          <input
            type="range"
            min={0}
            max={1500}
            step={50}
            value={debounce}
            onChange={(e) => setDebounce(parseInt(e.currentTarget.value))}
          />
          <span className="text-xs text-muted-foreground w-12">
            {debounce}ms
          </span>
        </div>
      </div>

      <div className="ml-2 flex items-center gap-2">
        <Label>2D</Label>
        <Switch checked={is2D} onCheckedChange={setIs2D} />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Select value={geomName} onValueChange={setGeomName}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Geometry" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {geomOptions.map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          value={drawMode}
          onValueChange={(v: DrawMode) => setDrawMode(v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Draw Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TRIANGLES">
              <Tri className="inline h-4 w-4 mr-2" />
              TRIANGLES
            </SelectItem>
            <SelectItem value="LINES">
              <Hash className="inline h-4 w-4 mr-2" />
              LINES
            </SelectItem>
            <SelectItem value="LINE_STRIP">
              <Move className="inline h-4 w-4 mr-2" />
              LINE_STRIP
            </SelectItem>
            <SelectItem value="POINTS">
              <Pointer className="inline h-4 w-4 mr-2" />
              POINTS
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 ml-2">
          <Label>Scale</Label>
          <input
            type="range"
            min={0.1}
            max={5}
            step={0.1}
            value={scale}
            onChange={(e) => setScale(parseFloat(e.currentTarget.value))}
          />
        </div>
        <div className="flex items-center gap-2 ml-2">
          <Label>Wire</Label>
          <Switch checked={wire} onCheckedChange={setWire} />
          <Label>Points</Label>
          <Switch checked={points} onCheckedChange={setPoints} />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={download}
          title="Export geometry JSON"
        >
          <Download className="h-4 w-4" />
        </Button>
        <label className="inline-flex items-center gap-2 px-2 py-1 border rounded-md cursor-pointer text-xs">
          <Upload className="h-4 w-4" /> OBJ
          <input
            type="file"
            accept=".obj"
            className="hidden"
            onChange={(e) => {
              const f = e.currentTarget.files?.[0]
              if (f) uploadOBJ(f)
            }}
          />
        </label>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 w-full">
        <span>Status: {status}</span>
        {error && <span className="text-red-300">{error}</span>}
        <span className="ml-auto">
          Uniforms: iTime, iResolution, iMouse, uModel, uViewProj · Attributes:
          aPos, aNormal, aUV
        </span>
      </div>
    </div>
  )
}
