import React, { useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { Toolbar } from "@/components/Toolbar"
import { CanvasView } from "@/components/CanvasView"
import { GeometryPanel } from "@/components/GeometryPanel"
import { Controls, type RenderControls } from "@/components/Controls"
import { type Uniforms } from "@/components/UniformControls"
import { DEFAULT_FS, DEFAULT_VS } from "@/lib/defaultShaders"
import { PRESETS, parseOBJ } from "@/lib/geom"
import type { Geom } from "@/types"

// Extend Window interface for the paused flag
declare global {
  interface Window {
    __paused__?: boolean
  }
}

export default function App() {
  const [vs] = useState<string>(
    () => localStorage.getItem("glsl_vs") || DEFAULT_VS
  )
  const [fs] = useState<string>(
    () => localStorage.getItem("glsl_fs") || DEFAULT_FS
  )
  const [auto, setAuto] = useState(true)
  const [debounce, setDebounce] = useState(300)
  const [status, setStatus] = useState("Ready.")
  const [error, setError] = useState("")
  const [geomName, setGeomName] = useState<string>("Triangle (2D)")
  const [frameCount, setFrameCount] = useState(0)
  const [fps, setFps] = useState(0)

  // Uniform state for shader parameters
  const [uniforms, setUniforms] = useState<Uniforms>({
    uScale: {
      type: "float",
      value: 1.0,
      min: 0.1,
      max: 5.0,
      step: 0.1,
      label: "Scale",
    },
    uColor: {
      type: "vec3",
      value: [0.4, 0.7, 1.0],
      min: 0,
      max: 1,
      step: 0.01,
      label: "Color",
    },
    uIntensity: {
      type: "float",
      value: 0.5,
      min: 0,
      max: 2,
      step: 0.01,
      label: "Intensity",
    },
    uAnimate: { type: "bool", value: true, label: "Animate" },
  })

  // Render controls state
  const [renderControls, setRenderControls] = useState<RenderControls>({
    scale: 1,
    wire: false,
    points: false,
    is2D: true,
    drawMode: "TRIANGLES",
  })

  const geom = useMemo<Geom>(
    () => PRESETS[geomName] ?? PRESETS["Triangle (2D)"],
    [geomName]
  )

  function onCompileStatus(s: string, e: string) {
    setStatus(s)
    setError(e)
  }

  function compile() {
    window.glslCompile?.()
  }
  function pauseResume() {
    if (!window.glslPause) {
      /* CanvasView exposes APIs on window */
    }
    // Simple toggle:
    if (window.__paused__) {
      window.glslResume?.()
      window.__paused__ = false
    } else {
      window.glslPause?.()
      window.__paused__ = true
    }
  }
  function reset() {
    window.glslReset?.()
  }

  function download() {
    const g = PRESETS[geomName]
    const blob = new Blob([JSON.stringify(g, null, 2)], {
      type: "application/json",
    })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "geometry.json"
    a.click()
    URL.revokeObjectURL(a.href)
  }
  function uploadOBJ(file: File) {
    file.text().then((txt) => {
      try {
        parseOBJ(txt)
        setGeomName("(OBJ)")
      } catch (e: unknown) {
        setError(
          "OBJ parse error: " + (e instanceof Error ? e.message : String(e))
        )
      }
    })
  }

  // Uniform change handler
  function handleUniformChange(name: string, value: Uniforms[string]["value"]) {
    setUniforms((prev) => ({
      ...prev,
      [name]: { ...prev[name], value },
    }))
  }

  // Render control change handler
  function handleRenderControlChange(
    key: keyof RenderControls,
    value: RenderControls[keyof RenderControls]
  ) {
    setRenderControls((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // persist
  React.useEffect(() => {
    localStorage.setItem("glsl_vs", vs)
  }, [vs])
  React.useEffect(() => {
    localStorage.setItem("glsl_fs", fs)
  }, [fs])

  return (
    <div className="w-full h-[100vh] p-2">
      <Card className="h-full grid grid-rows-[auto,1fr]">
        <CardHeader className="py-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              GLSL Playground — React/TS
            </CardTitle>
          </div>
          <Toolbar
            status={status}
            error={error}
            auto={auto}
            setAuto={setAuto}
            debounce={debounce}
            setDebounce={setDebounce}
            is2D={renderControls.is2D}
            setIs2D={(value) => handleRenderControlChange("is2D", value)}
            geomName={geomName}
            setGeomName={setGeomName}
            geomOptions={Object.keys(PRESETS)}
            drawMode={renderControls.drawMode}
            setDrawMode={(value) =>
              handleRenderControlChange("drawMode", value)
            }
            scale={renderControls.scale}
            setScale={(value) => handleRenderControlChange("scale", value)}
            wire={renderControls.wire}
            setWire={(value) => handleRenderControlChange("wire", value)}
            points={renderControls.points}
            setPoints={(value) => handleRenderControlChange("points", value)}
            compile={compile}
            pauseResume={pauseResume}
            isPaused={window.__paused__ ?? false}
            reset={reset}
            download={download}
            uploadOBJ={uploadOBJ}
          />
        </CardHeader>

        <CardContent className="p-2 overflow-hidden">
          <PanelGroup direction="horizontal" className="h-full">
            <Panel defaultSize={44} minSize={28} className="h-full">
              <Controls
                uniforms={uniforms}
                renderControls={renderControls}
                onUniformChange={handleUniformChange}
                onRenderControlChange={handleRenderControlChange}
              />
              <GeometryPanel
                onApply={(g, label) => {
                  /* In a full app you might replace PRESETS; for demo we just log */ console.log(
                    "apply geom",
                    label,
                    g
                  )
                }}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-border hover:bg-primary/40 transition-colors" />
            <Panel minSize={30} className="h-full">
              <div className="relative h-full w-full rounded-xl border bg-black/60">
                <CanvasView
                  vs={vs}
                  fs={fs}
                  geom={geom}
                  scale={renderControls.scale}
                  is2D={renderControls.is2D}
                  drawMode={renderControls.drawMode}
                  wire={renderControls.wire}
                  points={renderControls.points}
                  auto={auto}
                  debounce={debounce}
                  uniforms={uniforms}
                  onCompileStatus={onCompileStatus}
                  setFrameCount={setFrameCount}
                  setFps={setFps}
                />
                <div className="absolute left-2 bottom-2 text-[10px] text-muted-foreground bg-background/60 border rounded-md px-2 py-1">
                  <div>
                    {renderControls.is2D
                      ? "2D mode: geometry in clip space (−1..1)"
                      : "orbit: drag • pan: Shift+drag • zoom: wheel"}
                  </div>
                  <div className="mt-1">
                    FPS: {fps} | Frames: {frameCount}
                  </div>
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </CardContent>

        <CardFooter className="py-2 text-xs text-muted-foreground">
          Cmd/Ctrl+Enter to compile. Pause halts repaint; compile triggers one
          frame when paused.
        </CardFooter>
      </Card>
    </div>
  )
}
