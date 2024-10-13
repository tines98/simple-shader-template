import { useEffect, useMemo, useState } from "react"

function useShader(width: number, height: number){
  const [vertShaderPath, setVertShaderPath] = useState<string | undefined>()
  const [fragShaderPath, setFragShaderPath] = useState<string | undefined>()
  const [vertShaderSource, setVertShaderSource] = useState('')
  const [fragShaderSource, setFragShaderSource] = useState('')
  const [gl, setGl] = useState<WebGLRenderingContext | null | undefined>()

  const vertices = new Float32Array([
    //Tri 1
   -1.0, -1.0, //bot left
    1.0, -1.0, //bot right
   -1.0,  1.0, //top left
    //Tri 2
    1.0, -1.0, //bot right
    1.0,  1.0, //top right
   -1.0,  1.0, //top left
  ])

  const compileShader = (gl: WebGLRenderingContext, source: string, type: number) => {
    const shader = gl.createShader(type)
    if (!shader) return null
  
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
  
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Error compiling shader:', gl.getShaderInfoLog(shader))
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
  },[vertShaderSource])

  const fragmentShader = useMemo(() => {
    if (!gl) return null;
    if (!fragShaderSource) return null
    return compileShader(gl, fragShaderSource, gl.FRAGMENT_SHADER)
  },[fragShaderSource])
  
  // Load Vertex
  useEffect(() => {
    if (!vertShaderPath) return
    fetch(vertShaderPath)
      .then(r => r.text())
      .then(r => setVertShaderSource(r))
    }, [vertShaderPath])
    
    // Load Fragment
    useEffect(() => {
      if (!fragShaderPath) return
      fetch(fragShaderPath)
        .then(r => r.text())
        .then(r => setFragShaderSource(r))
    }, [fragShaderPath])

  useEffect(() => {
    if (!gl) return
    if (!vertexShader || !fragmentShader) return

    const program = gl.createProgram()
    if (!program) return

    
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    
    
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Error linking program:', gl.getProgramInfoLog(program))
      return
    }
    
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    
    const positionLocation = gl.getAttribLocation(program, 'position')
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(positionLocation)
    
    gl.useProgram(program)
    // UNIFORMS
    const colorLocation = gl.getUniformLocation(program, "color")
    gl.uniform3f(colorLocation, 1.0, 0.5, 1.0)
    
    const resolutionLocation = gl.getUniformLocation(program, "resolution")
    gl.uniform2f(resolutionLocation, width, height)

    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }, [gl, vertShaderSource, fragShaderSource])

  return {
    gl,
    setGl,
    setVertShaderPath,
    setFragShaderPath,
  }
}

export default useShader