function quaternion(x, y, z)
{
    sx = Math.sin(x * 0.5);
    cx = Math.cos(x * 0.5);
    sy = Math.sin(y * 0.5);
    cy = Math.cos(y * 0.5);
    sz = Math.sin(z * 0.5);
    cz = Math.cos(z * 0.5);

    return {
        w: cz * cy * cx + sz * sy * sx,
        x: sz * cy * cx - cz * sy * sx,
        y: cz * sy * cx + sz * cy * sx,
        z: cz * cy * sx - sz * sy * cx
    }
}

function qmult(a, b)
{
    return {
        w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
        x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
        y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
        z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w
    }
}

function cross(a, b)
{
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    }
}

function dot(a, b)
{
    return a.x * b.x + a.y * b.y + a.z * b.z
}

function vmult(v, q)
{
    c1 = cross(q, v)
    c2 = cross(q, c1)
    return {
        x: v.x + 2 * (q.w * c1.x + c2.x),
        y: v.y + 2 * (q.w * c1.y + c2.y),
        z: v.z + 2 * (q.w * c1.z + c2.z)
    }
}

function normalize(v)
{
    var rsqrt = 1 / Math.sqrt(dot(v, v))
    return {
        x: v.x * rsqrt,
        y: v.y * rsqrt,
        z: v.z * rsqrt
    }
}