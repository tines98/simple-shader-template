export type Geom = {
  positions: number[]
  normals?: number[]
  uvs?: number[]
  indices?: number[]
}

export type Shader = {
  vertexShader: string
  fragmentShader: string
}
