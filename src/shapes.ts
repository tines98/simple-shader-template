export const box = new Float32Array([
  // Front face
  -1.0,
  -1.0,
  1.0, // bottom left
  1.0,
  -1.0,
  1.0, // bottom right
  -1.0,
  1.0,
  1.0, // top left
  1.0,
  -1.0,
  1.0, // bottom right
  1.0,
  1.0,
  1.0, // top right
  -1.0,
  1.0,
  1.0, // top left

  // Back face
  -1.0,
  -1.0,
  -1.0, // bottom left
  1.0,
  -1.0,
  -1.0, // bottom right
  -1.0,
  1.0,
  -1.0, // top left
  1.0,
  -1.0,
  -1.0, // bottom right
  1.0,
  1.0,
  -1.0, // top right
  -1.0,
  1.0,
  -1.0, // top left

  // Top face
  -1.0,
  1.0,
  -1.0, // back left
  1.0,
  1.0,
  -1.0, // back right
  -1.0,
  1.0,
  1.0, // front left
  1.0,
  1.0,
  -1.0, // back right
  1.0,
  1.0,
  1.0, // front right
  -1.0,
  1.0,
  1.0, // front left

  // Bottom face
  -1.0,
  -1.0,
  -1.0, // back left
  1.0,
  -1.0,
  -1.0, // back right
  -1.0,
  -1.0,
  1.0, // front left
  1.0,
  -1.0,
  -1.0, // back right
  1.0,
  -1.0,
  1.0, // front right
  -1.0,
  -1.0,
  1.0, // front left

  // Right face
  1.0,
  -1.0,
  -1.0, // bottom back
  1.0,
  1.0,
  -1.0, // top back
  1.0,
  -1.0,
  1.0, // bottom front
  1.0,
  1.0,
  -1.0, // top back
  1.0,
  1.0,
  1.0, // top front
  1.0,
  -1.0,
  1.0, // bottom front

  // Left face
  -1.0,
  -1.0,
  -1.0, // bottom back
  -1.0,
  1.0,
  -1.0, // top back
  -1.0,
  -1.0,
  1.0, // bottom front
  -1.0,
  1.0,
  -1.0, // top back
  -1.0,
  1.0,
  1.0, // top front
  -1.0,
  -1.0,
  1.0, // bottom front
])

export const screenQuad = new Float32Array([
  -1.0, -1.0, 0.0, 0.0, 1.0, -1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0,
  1.0,
])
