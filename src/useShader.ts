import { useEffect, useMemo, useState } from "react"
import { box } from "./shapes"

function useShader(width: number, height: number) {
  const [vertShaderPath, setVertShaderPath] = useState<string | undefined>()
  const [fragShaderPath, setFragShaderPath] = useState<string | undefined>()
  const [vertShaderSource, setVertShaderSource] = useState("")
  const [fragShaderSource, setFragShaderSource] = useState("")
  const [gl, setGl] = useState<WebGLRenderingContext | null | undefined>()
  const vertices = box

  // Add camera state
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, z: -3 })
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0, z: 0 })

  // Add mouse control state
  const [isDragging, setIsDragging] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })

  // Add matrix utilities
  const createModelViewMatrix = (
    position: { x: number; y: number; z: number },
    rotation: { x: number; y: number; z: number }
  ) => {
    // Create rotation matrices
    const cosX = Math.cos(rotation.x)
    const sinX = Math.sin(rotation.x)
    const cosY = Math.cos(rotation.y)
    const sinY = Math.sin(rotation.y)
    const cosZ = Math.cos(rotation.z)
    const sinZ = Math.sin(rotation.z)

    // Combined rotation matrix
    const rotationMatrix = new Float32Array([
      cosY * cosZ,
      -cosY * sinZ,
      sinY,
      0,
      sinX * sinY * cosZ + cosX * sinZ,
      -sinX * sinY * sinZ + cosX * cosZ,
      -sinX * cosY,
      0,
      -cosX * sinY * cosZ + sinX * sinZ,
      cosX * sinY * sinZ + sinX * cosZ,
      cosX * cosY,
      0,
      0,
      0,
      0,
      1,
    ])

    // Modify the translation part of the matrix
    return new Float32Array([
      rotationMatrix[0],
      rotationMatrix[1],
      rotationMatrix[2],
      rotationMatrix[3],
      rotationMatrix[4],
      rotationMatrix[5],
      rotationMatrix[6],
      rotationMatrix[7],
      rotationMatrix[8],
      rotationMatrix[9],
      rotationMatrix[10],
      rotationMatrix[11],
      position.x, // Translation X
      position.y, // Translation Y
      position.z, // Translation Z
      1,
    ])
  }

  const createPerspectiveMatrix = (
    fieldOfView: number,
    aspect: number,
    near: number,
    far: number
  ) => {
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfView)
    const rangeInv = 1.0 / (near - far)

    return new Float32Array([
      f / aspect,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (near + far) * rangeInv,
      -1,
      0,
      0,
      near * far * rangeInv * 2,
      0,
    ])
  }

  const compileShader = (
    gl: WebGLRenderingContext,
    source: string,
    type: number
  ) => {
    const shader = gl.createShader(type)
    if (!shader) return null

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Error compiling shader:", gl.getShaderInfoLog(shader))
      console.error(source)
      gl.deleteShader(shader)
      return null
    }

    return shader
  }

  const vertexShader = useMemo(() => {
    if (!gl) return null
    if (!vertShaderSource) return null
    return compileShader(gl, vertShaderSource, gl.VERTEX_SHADER)
  }, [vertShaderSource])

  const fragmentShader = useMemo(() => {
    if (!gl) return null
    if (!fragShaderSource) return null
    return compileShader(gl, fragShaderSource, gl.FRAGMENT_SHADER)
  }, [fragShaderSource])

  // Load Vertex
  useEffect(() => {
    if (!vertShaderPath) return
    fetch(vertShaderPath)
      .then((r) => r.text())
      .then((r) => setVertShaderSource(r))
  }, [vertShaderPath])

  // Load Fragment
  useEffect(() => {
    if (!fragShaderPath) return
    fetch(fragShaderPath)
      .then((r) => r.text())
      .then((r) => setFragShaderSource(r))
  }, [fragShaderPath])

  useEffect(() => {
    if (!gl || !vertexShader || !fragmentShader) return
    const program = gl.createProgram()
    if (!program) return

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Error linking program:", gl.getProgramInfoLog(program))
      return
    }

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const positionLocation = gl.getAttribLocation(program, "position")
    // Update vertex attribute pointer to handle 3 coordinates (x, y, z)
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(positionLocation)

    gl.useProgram(program)

    // Add perspective matrix uniform
    const perspectiveMatrix = createPerspectiveMatrix(
      (60 * Math.PI) / 180, // 45 degree field of view
      width / height, // aspect ratio
      0.1, // near plane
      100.0 // far plane
    )
    const perspectiveLocation = gl.getUniformLocation(
      program,
      "uPerspectiveMatrix"
    )
    gl.uniformMatrix4fv(perspectiveLocation, false, perspectiveMatrix)

    // Mouse event handlers
    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true)
      setLastMousePos({ x: e.clientX, y: e.clientY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const deltaX = e.clientX - lastMousePos.x
      const deltaY = e.clientY - lastMousePos.y

      setCameraRotation((prev) => ({
        x: prev.x + deltaY * 0.005, // Vertical rotation (pitch)
        y: prev.y + deltaX * 0.005, // Horizontal rotation (yaw)
        z: prev.z,
      }))

      setLastMousePos({ x: e.clientX, y: e.clientY })
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      setCameraPosition((prev) => ({
        ...prev,
        z: prev.z + e.deltaY * 0.001, // Zoom in/out
      }))
    }

    // Add event listeners
    gl.canvas.addEventListener("mousedown", handleMouseDown as EventListener)
    window.addEventListener("mouseup", handleMouseUp as EventListener)
    window.addEventListener("mousemove", handleMouseMove as EventListener)
    gl.canvas.addEventListener("wheel", handleWheel as EventListener)

    let animationFrameId: number

    const render = () => {
      const modelViewMatrix = createModelViewMatrix(
        cameraPosition,
        cameraRotation
      )

      const modelViewLocation = gl.getUniformLocation(
        program,
        "uModelViewMatrix"
      )
      gl.uniformMatrix4fv(modelViewLocation, false, modelViewMatrix)

      // UNIFORMS
      const colorLocation = gl.getUniformLocation(program, "color")
      gl.uniform3f(colorLocation, 1.0, 0.2, 1.0)

      const resolutionLocation = gl.getUniformLocation(program, "resolution")
      gl.uniform2f(resolutionLocation, width, height)

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 36)

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId)
      gl.canvas.removeEventListener(
        "mousedown",
        handleMouseDown as EventListener
      )
      window.removeEventListener("mouseup", handleMouseUp as EventListener)
      window.removeEventListener("mousemove", handleMouseMove as EventListener)
      gl.canvas.removeEventListener("wheel", handleWheel as EventListener)
    }
  }, [
    gl,
    vertexShader,
    fragmentShader,
    isDragging,
    lastMousePos,
    cameraPosition,
    cameraRotation,
    width,
    height,
  ])

  const status = () => cameraPosition

  return {
    status,
    gl,
    setGl,
    setVertShaderPath,
    setFragShaderPath,
  }
}

export default useShader
