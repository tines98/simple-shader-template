import { useRef } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { Geom } from "@/types"

export function GeometryPanel({
  onApply,
}: {
  onApply: (g: Geom, label: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null)
  const placeholder = `{
  "positions": [ -0.6, -0.5, 0,  0.6, -0.5, 0,  0.0, 0.6, 0 ],
  "indices":   [ 0, 1, 2 ],
  "uvs":       [ 0,0,  1,0,  0.5,1 ],
  "normals":   [ 0,0,1,  0,0,1,  0,0,1 ]
}`
  return (
    <div className="mt-2 grid gap-2">
      <Label className="text-xs">Geometry JSON (paste and click Apply)</Label>
      <Textarea
        ref={ref}
        className="min-h-[140px] font-mono text-xs resize-y"
        placeholder={placeholder}
      />
      <button
        className="self-start rounded-md border px-3 py-1 text-xs hover:bg-accent"
        onClick={() => {
          const txt = ref.current?.value?.trim()
          if (!txt) return
          try {
            onApply(JSON.parse(txt) as Geom, "(JSON)")
          } catch (e: unknown) {
            alert(
              "Geometry JSON error: " +
                (e instanceof Error ? e.message : String(e))
            )
          }
        }}
      >
        Apply
      </button>
    </div>
  )
}
