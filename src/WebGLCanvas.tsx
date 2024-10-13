import React, { useRef, useEffect } from 'react'
import useShader from './useShader'

const WebGLCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const vertPath = './src/shaders/shader.vert'
  const fragPath = './src/shaders/shader.frag'
  const width = 800
  const height = 600
  const { setGl, setVertShaderPath, setFragShaderPath} = useShader(width,height)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl')
    setVertShaderPath(vertPath)
    setFragShaderPath(fragPath)
    setGl(gl)
  }, [])

  return (
    <>
      <canvas ref={canvasRef} width={width} height={height}></canvas>
    </>
  )
}

export default WebGLCanvas