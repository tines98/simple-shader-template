import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UniformControls, type Uniforms } from "./UniformControls"

export interface RenderControls {
  scale: number
  wire: boolean
  points: boolean
  is2D: boolean
  drawMode: "TRIANGLES" | "LINES" | "LINE_STRIP" | "POINTS"
}

interface ControlsProps {
  uniforms: Uniforms
  renderControls: RenderControls
  onUniformChange: (name: string, value: Uniforms[string]["value"]) => void
  onRenderControlChange: (
    key: keyof RenderControls,
    value: RenderControls[keyof RenderControls]
  ) => void
}

export function Controls({
  uniforms,
  renderControls,
  onUniformChange,
  onRenderControlChange,
}: ControlsProps) {
  return (
    <div className="h-full flex flex-col gap-4">
      {/* Render Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Render Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Scale: {renderControls.scale.toFixed(2)}
            </Label>
            <Slider
              value={[renderControls.scale]}
              onValueChange={([value]) => onRenderControlChange("scale", value)}
              min={0.1}
              max={5}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">2D Mode</Label>
            <Switch
              checked={renderControls.is2D}
              onCheckedChange={(checked) =>
                onRenderControlChange("is2D", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Wireframe</Label>
            <Switch
              checked={renderControls.wire}
              onCheckedChange={(checked) =>
                onRenderControlChange("wire", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Points</Label>
            <Switch
              checked={renderControls.points}
              onCheckedChange={(checked) =>
                onRenderControlChange("points", checked)
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Draw Mode</Label>
            <Select
              value={renderControls.drawMode}
              onValueChange={(value: RenderControls["drawMode"]) =>
                onRenderControlChange("drawMode", value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRIANGLES">Triangles</SelectItem>
                <SelectItem value="LINES">Lines</SelectItem>
                <SelectItem value="LINE_STRIP">Line Strip</SelectItem>
                <SelectItem value="POINTS">Points</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Uniform Controls */}
      <UniformControls uniforms={uniforms} onUniformChange={onUniformChange} />
    </div>
  )
}
