const canvas = document.getElementById("surface")
const ctx = canvas.getContext("2d")

// frames per second
const fps = 60

// colors
const background = "rgb(44, 47, 51)"

// game width and height
const width = 180
const height = 22
// number of starting cells
const spawn_rate = 0.25

// scale knot to fit the screen
var scaling = 0.2

// rotation of the knot
var rotation = quaternion(0, 0, Math.PI * 0.28)

// rotation gain per frame 0 <= x <= 2*pi
function rot(degrees)
{
    return degrees * Math.PI / (180 * fps)
}
var motion = quaternion(rot(15), rot(10), rot(20))