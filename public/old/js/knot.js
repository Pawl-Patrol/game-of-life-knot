function torus_knot(p, q)
{
    return {
        function: (x) =>
        {
            var c = Math.cos(q * x) + 2
            return {
                x: c * Math.cos(p * x),
                y: c * Math.sin(p * x),
                z: -Math.sin(q * x)
            }
        },
        derivative: (x) =>
        {
            return {
                x: -p * Math.sin(p * x) * (Math.cos(q * x) + 2) - q * Math.cos(p * x) * Math.sin(q * x),
                y: p * Math.cos(p * x) * (Math.cos(q * x) + 2) - q * Math.sin(p * x) * Math.sin(q * x),
                z: -q * Math.cos(q * x)
            }
        }
    }
}

function locate(knot, angle1, angle2)
{
    // position of destination
    var point = knot.function(angle1);

    // direction to next
    var slope = knot.derivative(angle1)

    // normalized crossproduct
    var span1 = normalize(cross(point, slope))

    // normalized position vector
    var span2 = normalize(point);

    // tube vector
    var sin = Math.sin(angle2)
    var cos = Math.cos(angle2)
    var tube = {
        x: span2.x * cos + span1.x * sin,
        y: span2.y * cos + span1.y * sin,
        z: span2.z * cos + span1.z * sin
    }

    // adding everything together
    var outer_radius = getValue('r₁')
    var inner_radius = getValue('r₂')
    return {
        x: point.x * outer_radius + tube.x * inner_radius,
        y: point.y * outer_radius + tube.y * inner_radius,
        z: point.z * outer_radius + tube.z * inner_radius
    }
}