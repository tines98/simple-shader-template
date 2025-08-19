export function I(): Float32Array {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
}
export function mul(a: Float32Array, b: Float32Array): Float32Array {
  const r = new Float32Array(16)
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      r[i * 4 + j] =
        a[i * 4 + 0] * b[0 * 4 + j] +
        a[i * 4 + 1] * b[1 * 4 + j] +
        a[i * 4 + 2] * b[2 * 4 + j] +
        a[i * 4 + 3] * b[3 * 4 + j]
  return r
}
export function persp(
  fovyRad: number,
  aspect: number,
  near: number,
  far: number
): Float32Array {
  const f = 1 / Math.tan(fovyRad / 2),
    nf = 1 / (near - far)
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
    (far + near) * nf,
    -1,
    0,
    0,
    2 * far * near * nf,
    0,
  ])
}
export function T(x: number, y: number, z: number): Float32Array {
  const m = I()
  m[12] = x
  m[13] = y
  m[14] = z
  return m
}
export function S(s: number): Float32Array {
  const m = I()
  m[0] = s
  m[5] = s
  m[10] = s
  return m
}
export function lookAt(
  eye: [number, number, number],
  center: [number, number, number],
  up: [number, number, number]
): Float32Array {
  let zx = eye[0] - center[0],
    zy = eye[1] - center[1],
    zz = eye[2] - center[2]
  let rl = 1 / Math.hypot(zx, zy, zz)
  zx *= rl
  zy *= rl
  zz *= rl
  let xx = up[1] * zz - up[2] * zy,
    xy = up[2] * zx - up[0] * zz,
    xz = up[0] * zy - up[1] * zx
  rl = 1 / Math.hypot(xx, xy, xz)
  xx *= rl
  xy *= rl
  xz *= rl
  const yx = zy * xz - zz * xy,
    yy = zz * xx - zx * xz,
    yz = zx * xy - zy * xx
  return new Float32Array([
    xx,
    yx,
    zx,
    0,
    xy,
    yy,
    zy,
    0,
    xz,
    yz,
    zz,
    0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    1,
  ])
}
