
function loop()
{
    // adjust size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // draw
    draw(ctx, torus_knot(getValue('p'), getValue('q')))
}

setInterval(() => {
    requestAnimationFrame(loop)
    rotation = qmult(rotation, motion)
}, 1000 / fps)