import { Geom } from "@/types"

export function triangle2D(): Geom {
  return {
    positions: [-0.6, -0.5, 0, 0.6, -0.5, 0, 0, 0.6, 0],
    uvs: [0, 0, 1, 0, 0.5, 1],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    indices: [0, 1, 2],
  }
}
export function cube(): Geom {
  const p: number[] = [],
    n: number[] = [],
    u: number[] = [],
    idx: number[] = []
  const f = [
    { n: [0, 0, 1], v: [-1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1] },
    { n: [0, 0, -1], v: [-1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, -1] },
    { n: [1, 0, 0], v: [1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1] },
    { n: [-1, 0, 0], v: [-1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1] },
    { n: [0, 1, 0], v: [-1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1] },
    { n: [0, -1, 0], v: [-1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1] },
  ]
  let base = 0
  for (const F of f) {
    const uv = [0, 0, 1, 0, 1, 1, 0, 1]
    for (let i = 0; i < 4; i++) {
      p.push(F.v[i * 3], F.v[i * 3 + 1], F.v[i * 3 + 2])
      n.push(F.n[0], F.n[1], F.n[2])
      u.push(uv[i * 2], uv[i * 2 + 1])
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3)
    base += 4
  }
  return { positions: p, normals: n, uvs: u, indices: idx }
}
export function sphere(segments = 48, rings = 24): Geom {
  const p: number[] = [],
    n: number[] = [],
    u: number[] = [],
    idx: number[] = []
  for (let y = 0; y <= rings; y++) {
    const v = y / rings
    const phi = v * Math.PI
    for (let x = 0; x <= segments; x++) {
      const uu = x / segments
      const th = uu * 2 * Math.PI
      const sx = Math.cos(th) * Math.sin(phi),
        sy = Math.cos(phi),
        sz = Math.sin(th) * Math.sin(phi)
      p.push(sx, sy, sz)
      n.push(sx, sy, sz)
      u.push(uu, 1 - v)
    }
  }
  for (let y = 0; y < rings; y++)
    for (let x = 0; x < segments; x++) {
      const i = y * (segments + 1) + x
      const a = i,
        b = i + segments + 1,
        c = i + segments + 2,
        d = i + 1
      idx.push(a, b, c, a, c, d)
    }
  return { positions: p, normals: n, uvs: u, indices: idx }
}
export function parseOBJ(text: string): Geom {
  const ps: number[] = [],
    ns: number[] = [],
    ts: number[] = []
  const P: number[] = [],
    N: number[] = [],
    T: number[] = []
  const I: number[] = []
  const lines = text.split(/\r?\n/)
  function g3(arr: number[], i: number | undefined) {
    if (!i || !arr.length) return [0, 0, 0]
    const k = i < 0 ? (arr.length / 3 + i) * 3 : (i - 1) * 3
    return [arr[k], arr[k + 1], arr[k + 2]]
  }
  function g2(arr: number[], i: number | undefined) {
    if (!i || !arr.length) return [0, 0]
    const k = i < 0 ? (arr.length / 2 + i) * 2 : (i - 1) * 2
    return [arr[k], arr[k + 1]]
  }
  function tri(tok: string) {
    const [vi, ti, ni] = tok.split("/").map((s) => (s ? parseInt(s, 10) : NaN))
    const v3 = g3(ps, vi)
    P.push(v3[0], v3[1], v3[2])
    const t2 = g2(ts, ti)
    T.push(t2[0], t2[1])
    const n3 = g3(ns, ni)
    N.push(n3[0], n3[1], n3[2])
  }
  function face(pts: string[]) {
    for (let i = 1; i < pts.length - 1; i++) {
      ;[pts[0], pts[i], pts[i + 1]].forEach(tri)
    }
  }
  for (const ln of lines) {
    const l = ln.trim()
    if (!l || l.startsWith("#")) continue
    const tok = l.split(/\s+/)
    if (tok[0] === "v")
      ps.push(parseFloat(tok[1]), parseFloat(tok[2]), parseFloat(tok[3]))
    else if (tok[0] === "vn")
      ns.push(parseFloat(tok[1]), parseFloat(tok[2]), parseFloat(tok[3]))
    else if (tok[0] === "vt") ts.push(parseFloat(tok[1]), parseFloat(tok[2]))
    else if (tok[0] === "f") face(tok.slice(1))
  }
  const map = new Map<string, number>()
  const outP: number[] = [],
    outN: number[] = [],
    outT: number[] = []
  for (let i = 0; i < P.length / 3; i++) {
    const key = `${P[i * 3].toFixed(6)},${P[i * 3 + 1].toFixed(6)},${P[
      i * 3 + 2
    ].toFixed(6)}|${N[i * 3].toFixed(6)},${N[i * 3 + 1].toFixed(6)},${N[
      i * 3 + 2
    ].toFixed(6)}|${T[i * 2].toFixed(6)},${T[i * 2 + 1].toFixed(6)}`
    let k = map.get(key)
    if (k === undefined) {
      k = outP.length / 3
      outP.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2])
      outN.push(N[i * 3], N[i * 3 + 1], N[i * 3 + 2])
      outT.push(T[i * 2], T[i * 2 + 1])
      map.set(key, k)
    }
    I.push(k)
  }
  return { positions: outP, normals: outN, uvs: outT, indices: I }
}
export const PRESETS: Record<string, Geom> = {
  "Triangle (2D)": triangle2D(),
  Cube: cube(),
  Sphere: sphere(),
}
