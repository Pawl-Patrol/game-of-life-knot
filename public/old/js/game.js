var game = new Array(width)

// Fill game with random cells
for (let x = 0; x < width; x++)
{
    game[x] = new Array(height)
    for (let y =0; y < height; y++)
    {
        game[x][y] = Math.random() < spawn_rate
    }
}

function neighbors(x, y)
{
    var sum = 0;
    for (let i = -1; i < 2; i++)
    {
        for (let j = -1; j < 2; j++)
        {
            if (!i && !j) continue
            sum += game[(width + x + i) % width][(height + y + j) % height]
        }
    }
    return sum;
}

function tick()
{
    // Create game copy
    var copy = new Array(width)
    for (let i = 0; i < width; i++)
    {
        copy[i] = new Array(height)
        for (let j = 0; j < height; j++)
        {
            copy[i][j] = game[i][j]
        }
    }

    // Game logic
    for (let x = 0; x < width; x++)
    {
        for (let y = 0; y < height; y++)
        {
            sum = neighbors(x, y);
            if (game[x][y])
            {
                if ((sum < 2) || (sum > 3))
                {
                    copy[x][y] = false;
                }
            }
            else if (sum == 3)
            {
                copy[x][y] = true;
            }
        }
    }

    // Update changes
    for (let i = 0; i < width; i++)
    {
        for (let j = 0; j < height; j++)
        {
            game[i][j] = copy[i][j];
        }
    }
}

setInterval(tick, 800);