import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"

export interface UniformValue {
  type: "float" | "vec2" | "vec3" | "vec4" | "int" | "bool"
  value: number | number[] | boolean
  min?: number
  max?: number
  step?: number
  label?: string
}

export interface Uniforms {
  [key: string]: UniformValue
}

interface UniformControlsProps {
  uniforms: Uniforms
  onUniformChange: (name: string, value: UniformValue["value"]) => void
}

export function UniformControls({
  uniforms,
  onUniformChange,
}: UniformControlsProps) {
  const renderUniformControl = (name: string, uniform: UniformValue) => {
    const { type, value, min = 0, max = 1, step = 0.01, label } = uniform

    switch (type) {
      case "float": {
        return (
          <div key={name} className="space-y-2">
            <Label className="text-xs font-medium">
              {label || name}:{" "}
              {typeof value === "number" ? value.toFixed(3) : value}
            </Label>
            <Slider
              value={[typeof value === "number" ? value : 0]}
              onValueChange={([newValue]: number[]) =>
                onUniformChange(name, newValue)
              }
              min={min}
              max={max}
              step={step}
              className="w-full"
            />
          </div>
        )
      }

      case "vec2": {
        const vec2Value = Array.isArray(value) ? value : [0, 0]
        return (
          <div key={name} className="space-y-2">
            <Label className="text-xs font-medium">{label || name}</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">X</Label>
                <Slider
                  value={[vec2Value[0] || 0]}
                  onValueChange={([newValue]: number[]) =>
                    onUniformChange(name, [newValue, vec2Value[1] || 0])
                  }
                  min={min}
                  max={max}
                  step={step}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Y</Label>
                <Slider
                  value={[vec2Value[1] || 0]}
                  onValueChange={([newValue]: number[]) =>
                    onUniformChange(name, [vec2Value[0] || 0, newValue])
                  }
                  min={min}
                  max={max}
                  step={step}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )
      }

      case "vec3": {
        const vec3Value = Array.isArray(value) ? value : [0, 0, 0]
        return (
          <div key={name} className="space-y-2">
            <Label className="text-xs font-medium">{label || name}</Label>
            <div className="grid grid-cols-3 gap-2">
              {["X", "Y", "Z"].map((axis, index) => (
                <div key={axis} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {axis}
                  </Label>
                  <Slider
                    value={[vec3Value[index] || 0]}
                    onValueChange={([newValue]: number[]) => {
                      const newVec3 = [...vec3Value]
                      newVec3[index] = newValue
                      onUniformChange(name, newVec3)
                    }}
                    min={min}
                    max={max}
                    step={step}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )
      }

      case "bool": {
        return (
          <div key={name} className="flex items-center justify-between">
            <Label className="text-xs font-medium">{label || name}</Label>
            <Switch
              checked={typeof value === "boolean" ? value : false}
              onCheckedChange={(checked) => onUniformChange(name, checked)}
            />
          </div>
        )
      }

      default: {
        return null
      }
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Uniforms</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(uniforms).map(([name, uniform]) =>
          renderUniformControl(name, uniform)
        )}
      </CardContent>
    </Card>
  )
}
