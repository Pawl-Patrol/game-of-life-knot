var names = ['p', 'q', 'r₁', 'r₂']
var inputs = {}

for (let i = 0; i < names.length; i++)
{
    let name = names[i]
    inputs[name] = document.getElementById(name)
}

function getValue(name)
{
    return inputs[name].children[1].value
}

function adjust()
{
    for (let name in inputs)
    {
        let obj = inputs[name]
        let label = obj.children[0]
        let input = obj.children[1]
        label.innerHTML =  `${name}: ${input.value}`
    }
}
document.addEventListener("input", adjust)
adjust()

document.addEventListener("wheel", (event) => {
    scaling *= 1 - 0.2 * Math.sign(event.deltaY)
})

var mouse_down = false
document.addEventListener("mousedown", () => {mouse_down = true})
document.addEventListener("mouseup", () => {mouse_down = false})
document.addEventListener("mousemove", (event) => {
    if (mouse_down)
    {
        movement = quaternion(
            0,
            Math.PI * event.movementX / canvas.width,
            Math.PI * -event.movementY / canvas.height
        )
        rotation = qmult(movement, rotation)
    }
})