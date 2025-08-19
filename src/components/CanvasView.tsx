import { useEffect, useRef, useState } from "react"
import { I, S, persp, lookAt, mul } from "@/lib/mat4"
import { linkProgram } from "@/lib/gl"
import type { Geom } from "@/types"
import type { Uniforms } from "./UniformControls"

// Extend Window interface for our custom properties
declare global {
  interface Window {
    glslPause: () => void
    glslResume: () => void
    glslReset: () => void
    glslCompile: () => void
  }
}

export type DrawMode = "TRIANGLES" | "LINES" | "LINE_STRIP" | "POINTS"

interface Props {
  vs: string
  fs: string
  geom: Geom
  scale: number
  is2D: boolean
  drawMode: DrawMode
  wire: boolean
  points: boolean
  auto: boolean
  debounce: number
  uniforms: Uniforms
  onCompileStatus: (status: string, error: string) => void
  setFrameCount: (frameCount: number) => void
  setFps: (fps: number) => void
}

export function CanvasView({
  vs,
  fs,
  geom,
  scale,
  is2D,
  drawMode,
  wire,
  points,
  auto,
  debounce,
  uniforms,
  onCompileStatus,
  setFrameCount,
  setFps,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const progRef = useRef<WebGLProgram | null>(null)
  const bufs = useRef<{
    pos?: WebGLBuffer | null
    n?: WebGLBuffer | null
    uv?: WebGLBuffer | null
    i?: WebGLBuffer | null
    hasN?: boolean
    hasUV?: boolean
  }>({})
  const idxCount = useRef(0)
  const useElems = useRef(false)
  const paused = useRef(false)
  const startRef = useRef(performance.now())
  const pausedAt = useRef(0)
  const frameCountRef = useRef(0)
  const lastFpsUpdateRef = useRef(performance.now())
  const fpsRef = useRef(0)
  const dpr = Math.min(
    2.5,
    typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
  )

  // Add camera state for 3D mode
  const [camera, setCamera] = useState({
    position: [0, 0, 3] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  })

  // Add mouse state
  const [mouseState, setMouseState] = useState({
    isDragging: false,
    lastPosition: { x: 0, y: 0 },
  })

  // public API via window (optional) could be added; here we expose pause/resume via custom events if needed

  // Compile program (debounced externally by parent via auto/inputs)
  useEffect(() => {
    if (!auto) return
    const id = setTimeout(() => compile(false), debounce)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vs, fs, auto, debounce])

  // Init GL
  useEffect(() => {
    const canvas = canvasRef.current!
    const gl = canvas.getContext("webgl", {
      antialias: true,
      preserveDrawingBuffer: true,
    })
    if (!gl) {
      onCompileStatus("Error", "WebGL not supported")
      return
    }
    glRef.current = gl
    try {
      progRef.current = linkProgram(gl, vs, fs)
      onCompileStatus("Compiled ✓", "")
    } catch (e: unknown) {
      onCompileStatus(
        "Compile error",
        e instanceof Error ? e.message : String(e)
      )
    }

    const onResize = () => {
      const r = canvas.getBoundingClientRect()
      const w = Math.max(1, Math.floor(r.width * dpr)),
        h = Math.max(1, Math.floor(r.height * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
    }
    onResize()
    const ro = new ResizeObserver(onResize)
    ro.observe(canvas)

    let raf = 0
    const loop = (now: number) => {
      if (!gl || !progRef.current) {
        raf = requestAnimationFrame(loop)
        return
      }
      if (paused.current) {
        raf = 0
        return
      } // stop repainting when paused
      render(gl, now)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Add mouse event handlers
  useEffect(() => {
    if (is2D) return // Only add controls in 3D mode

    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseDown = (e: MouseEvent) => {
      setMouseState((prev) => ({
        ...prev,
        isDragging: true,
        lastPosition: { x: e.clientX, y: e.clientY },
      }))
    }

    const handleMouseUp = () => {
      setMouseState((prev) => ({
        ...prev,
        isDragging: false,
      }))
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseState.isDragging) return

      const deltaX = e.clientX - mouseState.lastPosition.x
      const deltaY = e.clientY - mouseState.lastPosition.y

      setCamera((prev) => ({
        ...prev,
        rotation: [
          prev.rotation[0] + deltaY * 0.005,
          prev.rotation[1] + deltaX * 0.005,
          prev.rotation[2],
        ],
      }))

      setMouseState((prev) => ({
        ...prev,
        lastPosition: { x: e.clientX, y: e.clientY },
      }))
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      setCamera((prev) => ({
        ...prev,
        position: [
          prev.position[0],
          prev.position[1],
          prev.position[2] + e.deltaY * 0.001,
        ],
      }))
    }

    canvas.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("wheel", handleWheel)

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("wheel", handleWheel)
    }
  }, [is2D, mouseState.isDragging])

  // Rebuild buffers on geom change
  useEffect(() => {
    const gl = glRef.current
    if (!gl) return
    buildBuffers(gl, geom)
  }, [geom])

  // Re-render a single frame when paused and inputs change
  useEffect(() => {
    if (paused.current) renderOnce()
  }, [scale, is2D, drawMode, wire, points])

  function setPaused(p: boolean) {
    paused.current = p
    // Sync with window state for App component
    if (typeof window !== "undefined") {
      window.__paused__ = p
    }
  }
  window.glslPause = () => setPaused(true)
  window.glslResume = () => {
    setPaused(false)
    const gl = glRef.current
    if (gl) {
      requestAnimationFrame((t) => render(gl, t))
    }
  }
  window.glslReset = () => {
    startRef.current = performance.now()
    pausedAt.current = 0
    if (paused.current) renderOnce()
  }
  window.glslCompile = () => compile(true)

  function compile(fromUser: boolean) {
    const gl = glRef.current
    if (!gl) return
    try {
      const p = linkProgram(gl, vs, fs)
      if (progRef.current) gl.deleteProgram(progRef.current)
      progRef.current = p
      onCompileStatus(fromUser ? "Compiled ✓" : "Compiled", "")
      if (paused.current) renderOnce()
    } catch (e: unknown) {
      onCompileStatus(
        "Compile error",
        e instanceof Error ? e.message : String(e)
      )
    }
  }

  function buildBuffers(gl: WebGLRenderingContext, g: Geom) {
    const { positions, normals, uvs, indices } = g
    const pos = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, pos)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
    let nb: WebGLBuffer | null = null,
      ub: WebGLBuffer | null = null,
      ib: WebGLBuffer | null = null
    if (normals?.length) {
      nb = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, nb)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW)
    }
    if (uvs?.length) {
      ub = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, ub)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW)
    }
    if (indices?.length) {
      ib = gl.createBuffer()
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib)
      const u32 = Math.max(...indices) > 65535
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        u32 ? new Uint32Array(indices) : new Uint16Array(indices),
        gl.STATIC_DRAW
      )
    }
    bufs.current = { pos, n: nb, uv: ub, i: ib, hasN: !!nb, hasUV: !!ub }
    idxCount.current = indices?.length ? indices.length : positions.length / 3
    useElems.current = !!ib
    if (paused.current) renderOnce()
  }

  function renderOnce() {
    const gl = glRef.current
    if (!gl) return
    render(gl, performance.now())
  }

  function render(gl: WebGLRenderingContext, now: number) {
    const canvas = canvasRef.current!
    const r = canvas.getBoundingClientRect()
    const w = Math.max(1, Math.floor(r.width * dpr)),
      h = Math.max(1, Math.floor(r.height * dpr))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
    }

    if (is2D) gl.disable(gl.DEPTH_TEST)
    else gl.enable(gl.DEPTH_TEST)
    gl.clearColor(0.05, 0.07, 0.1, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | (is2D ? 0 : gl.DEPTH_BUFFER_BIT))

    const t = paused.current
      ? pausedAt.current
      : (now - startRef.current) * 0.001

    // Update frame counter and FPS
    frameCountRef.current++
    const timeSinceLastFpsUpdate = now - lastFpsUpdateRef.current
    if (timeSinceLastFpsUpdate >= 1000) {
      // Update FPS every second
      const currentFps = Math.round(
        (frameCountRef.current * 1000) / timeSinceLastFpsUpdate
      )
      fpsRef.current = currentFps
      lastFpsUpdateRef.current = now
      frameCountRef.current = 0
      setFps(currentFps)
    }
    setFrameCount(frameCountRef.current)

    gl.useProgram(progRef.current)
    const uModel = gl.getUniformLocation(progRef.current!, "uModel")
    const uVP = gl.getUniformLocation(progRef.current!, "uViewProj")
    const uTime = gl.getUniformLocation(progRef.current!, "iTime")
    const uRes = gl.getUniformLocation(progRef.current!, "iResolution")
    const uMouse = gl.getUniformLocation(progRef.current!, "iMouse")

    const model = S(scale)
    let vp = I()
    if (!is2D) {
      const aspect = canvas.width / Math.max(1, canvas.height)
      const proj = persp((45 * Math.PI) / 180, aspect, 0.01, 100)

      // Use camera position and rotation for view matrix
      const view = lookAt(camera.position, [0, 0, 0], [0, 1, 0])
      vp = mul(view, proj)
    }
    if (uModel) gl.uniformMatrix4fv(uModel, false, model)
    if (uVP) gl.uniformMatrix4fv(uVP, false, vp)
    if (uTime) gl.uniform1f(uTime, t)
    if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height)
    if (uMouse) gl.uniform4f(uMouse, 0, 0, 0, 0)

    // Set custom uniforms from the controls
    Object.entries(uniforms).forEach(([name, uniform]) => {
      const location = gl.getUniformLocation(progRef.current!, name)
      if (location) {
        switch (uniform.type) {
          case "float":
            gl.uniform1f(location, uniform.value as number)
            break
          case "vec2": {
            const vec2Value = uniform.value as number[]
            gl.uniform2f(location, vec2Value[0] || 0, vec2Value[1] || 0)
            break
          }
          case "vec3": {
            const vec3Value = uniform.value as number[]
            gl.uniform3f(
              location,
              vec3Value[0] || 0,
              vec3Value[1] || 0,
              vec3Value[2] || 0
            )
            break
          }
          case "vec4": {
            const vec4Value = uniform.value as number[]
            gl.uniform4f(
              location,
              vec4Value[0] || 0,
              vec4Value[1] || 0,
              vec4Value[2] || 0,
              vec4Value[3] || 0
            )
            break
          }
          case "int":
            gl.uniform1i(location, uniform.value as number)
            break
          case "bool":
            gl.uniform1i(location, (uniform.value as boolean) ? 1 : 0)
            break
        }
      }
    })

    const attrPos = 0,
      attrN = 1,
      attrUV = 2
    const b = bufs.current
    if (b.pos) {
      gl.bindBuffer(gl.ARRAY_BUFFER, b.pos)
      gl.enableVertexAttribArray(attrPos)
      gl.vertexAttribPointer(attrPos, 3, gl.FLOAT, false, 0, 0)
    }
    if (b.hasN && b.n && !is2D) {
      gl.bindBuffer(gl.ARRAY_BUFFER, b.n)
      gl.enableVertexAttribArray(attrN)
      gl.vertexAttribPointer(attrN, 3, gl.FLOAT, false, 0, 0)
    } else gl.disableVertexAttribArray(attrN)
    if (b.hasUV && b.uv) {
      gl.bindBuffer(gl.ARRAY_BUFFER, b.uv)
      gl.enableVertexAttribArray(attrUV)
      gl.vertexAttribPointer(attrUV, 2, gl.FLOAT, false, 0, 0)
    } else gl.disableVertexAttribArray(attrUV)
    if (b.i) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.i)

    const mode = points
      ? gl.POINTS
      : wire
      ? gl.LINES
      : (gl as WebGLRenderingContext & { [key: string]: number })[drawMode]
    if (useElems.current) {
      gl.drawElements(mode, idxCount.current, gl.UNSIGNED_INT, 0)
      if (gl.getError() !== gl.NO_ERROR) {
        gl.drawElements(mode, idxCount.current, gl.UNSIGNED_SHORT, 0)
      }
    } else {
      gl.drawArrays(mode, 0, idxCount.current)
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full rounded-xl border bg-black/60"
    />
  )
}
