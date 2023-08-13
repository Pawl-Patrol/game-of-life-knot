import { Vec2, vec3 } from "wgpu-matrix";

export function moebiusStrip([u, v]: Vec2) {
  u *= Math.PI * 2;
  v = v * 2 - 1;
  return [
    Math.cos(u) + v * Math.cos(u / 2) * Math.cos(u),
    Math.sin(u) + v * Math.cos(u / 2) * Math.sin(u),
    v * Math.sin(u / 2),
  ];
}

export function trefoilKnot(inner: number, outer: number) {
  return ([u, v]: Vec2) => {
    u *= Math.PI * 2;
    v *= Math.PI * 2;

    const r = vec3.create(
      Math.sin(u) + 2 * Math.sin(2 * u),
      Math.cos(u) - 2 * Math.cos(2 * u),
      -Math.sin(3 * u)
    );
    const tangent = vec3.create(
      Math.cos(u) + 4 * Math.cos(2 * u),
      -Math.sin(u) + 4 * Math.sin(2 * u),
      -3 * Math.cos(3 * u)
    );
    const normal = vec3.create(
      -Math.sin(u) - 8 * Math.sin(2 * u),
      -Math.cos(u) + 8 * Math.cos(2 * u),
      9 * Math.sin(3 * u)
    );
    const binormal = vec3.cross(normal, tangent);

    vec3.normalize(normal, normal);
    vec3.normalize(binormal, binormal);

    vec3.scale(r, inner, r);
    vec3.addScaled(r, normal, Math.cos(v) * outer, r);
    vec3.addScaled(r, binormal, Math.sin(v) * outer, r);

    return r;
  };
}
