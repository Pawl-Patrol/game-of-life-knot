function project(ctx, v)
{
    // project 3D space on the 2D screen
    temp = (v.z + 100) * 0.01 * scaling * Math.min(ctx.canvas.width, ctx.canvas.height)
    return {
        x: ctx.canvas.width * 0.5 + v.x * temp,
        y: ctx.canvas.height * 0.5 + v.y * temp,
        z: v.z // keep for depth
    }
}

function drawCell(ctx, knot, x, y, alive)
{
    ctx.fillStyle = "hsl(" + (360 * x / width) + ",100%," + (alive ? 50 : 5) + "%)"
    ctx.beginPath();
    for(let i = 0; i < 2; i++)
    {
        for (let j = 0; j < 2; j++)
        {
            let v = vmult(locate(knot,
                Math.PI * 2 * (x + i) / width,
                Math.PI * 2 * (y + (j ^ i)) / height
            ), rotation)
            v = project(ctx, v)
            ctx.lineTo(v.x, v.y);
        }
    }
    ctx.closePath();
    ctx.fill();
}

function draw(ctx, knot)
{
    // draw background
    ctx.fillStyle = background
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // sort all cells by their distance from the viewer
    objs = []
    for (let x = 0; x < width; x++)
    {
        for (let y = 0; y < height; y++)
        {
            let v = vmult(locate(knot,
                Math.PI * 2 * (x + 0.5) / width,
                Math.PI * 2 * (y + 0.5) / height
            ), rotation)
            objs.push([v.z, x, y])
        }
    }
    objs.sort(function(a, b) {return a[0] - b[0]})

    // draw every object in the right order
    for (let i = 0; i < objs.length; i++)
    {
        let x = objs[i][1];
        let y = objs[i][2];
        drawCell(ctx, knot, x, y, game[x][y])
    }
}