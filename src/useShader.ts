import { useEffect, useMemo, useState } from "react"
import { box } from "./shapes"

// Separate types into interfaces
interface Camera {
  position: Vector3
  rotation: Vector3
}

interface Vector3 {
  x: number
  y: number
  z: number
}

interface MouseState {
  isDragging: boolean
  lastPosition: { x: number; y: number }
}

function useShader(width: number, height: number) {
  // Group related state
  const [shaderState, setShaderState] = useState({
    vertPath: undefined as string | undefined,
    fragPath: undefined as string | undefined,
    vertSource: "",
    fragSource: "",
  })

  const [gl, setGl] = useState<WebGLRenderingContext | null | undefined>()
  const vertices = box

  // Group camera state
  const [camera, setCamera] = useState<Camera>({
    position: { x: 0, y: 0, z: -3 },
    rotation: { x: 0, y: 0, z: 0 },
  })

  // Group mouse state
  const [mouseState, setMouseState] = useState<MouseState>({
    isDragging: false,
    lastPosition: { x: 0, y: 0 },
  })

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
    if (!shaderState.vertSource) return null
    return compileShader(gl, shaderState.vertSource, gl.VERTEX_SHADER)
  }, [shaderState.vertSource])

  const fragmentShader = useMemo(() => {
    if (!gl) return null
    if (!shaderState.fragSource) return null
    return compileShader(gl, shaderState.fragSource, gl.FRAGMENT_SHADER)
  }, [shaderState.fragSource])

  // Separate shader loading logic
  useEffect(() => {
    const loadShader = async (path: string | undefined) => {
      if (!path) return ""
      const response = await fetch(path)
      return response.text()
    }

    Promise.all([
      loadShader(shaderState.vertPath),
      loadShader(shaderState.fragPath),
    ]).then(([vertSource, fragSource]) => {
      setShaderState((prev) => ({
        ...prev,
        vertSource,
        fragSource,
      }))
    })
  }, [shaderState.vertPath, shaderState.fragPath])

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
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(positionLocation)

    gl.useProgram(program)

    const perspectiveMatrix = createPerspectiveMatrix(
      (60 * Math.PI) / 180,
      width / height,
      0.1,
      100.0
    )
    const perspectiveLocation = gl.getUniformLocation(
      program,
      "uPerspectiveMatrix"
    )
    gl.uniformMatrix4fv(perspectiveLocation, false, perspectiveMatrix)

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
        rotation: {
          x: prev.rotation.x + deltaY * 0.005,
          y: prev.rotation.y + deltaX * 0.005,
          z: prev.rotation.z,
        },
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
        position: {
          ...prev.position,
          z: prev.position.z + e.deltaY * 0.001,
        },
      }))
    }

    gl.canvas.addEventListener("mousedown", handleMouseDown as EventListener)
    window.addEventListener("mouseup", handleMouseUp as EventListener)
    window.addEventListener("mousemove", handleMouseMove as EventListener)
    gl.canvas.addEventListener("wheel", handleWheel as EventListener)

    let animationFrameId: number

    const render = () => {
      const modelViewMatrix = createModelViewMatrix(
        camera.position,
        camera.rotation
      )

      const modelViewLocation = gl.getUniformLocation(
        program,
        "uModelViewMatrix"
      )
      gl.uniformMatrix4fv(modelViewLocation, false, modelViewMatrix)

      const colorLocation = gl.getUniformLocation(program, "color")
      gl.uniform3f(colorLocation, 1.0, 0.2, 1.0)

      const resolutionLocation = gl.getUniformLocation(program, "resolution")
      gl.uniform2f(resolutionLocation, width, height)

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 36)

      animationFrameId = requestAnimationFrame(render)
    }

    render()

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
    mouseState.isDragging,
    camera,
    width,
    height,
  ])

  return {
    status: () => camera.position,
    gl,
    setGl,
    setVertShaderPath: (path: string) =>
      setShaderState((prev) => ({ ...prev, vertPath: path })),
    setFragShaderPath: (path: string) =>
      setShaderState((prev) => ({ ...prev, fragPath: path })),
  }
}

export default useShader
