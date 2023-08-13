@binding(0) @group(0) var<uniform> view : mat4x4<f32>;
@binding(1) @group(0) var<uniform> size : vec2<u32>;

struct Out {
  @builtin(position) pos: vec4<f32>,
  @location(0) cell: f32,
  @location(1) color: vec3<f32>,
}

@vertex
fn main(
  @builtin(instance_index) i: u32,
  @location(0) pos: vec4<f32>,
  @location(1) cell: u32,
  @location(2) color: vec3<f32>,
  @location(3) bl: vec3<f32>,
  @location(4) tl: vec3<f32>,
  @location(5) br: vec3<f32>,
  @location(6) tr: vec3<f32>,
) -> Out {
  let model = mat4x4<f32>(
    bl.x, bl.y, bl.z, 1.0,
    tl.x, tl.y, tl.z, 1.0,
    br.x, br.y, br.z, 1.0,
    tr.x, tr.y, tr.z, 1.0
  );

  var output : Out;

  output.pos = view * model * pos;
  output.cell = f32(cell);
  output.color = color;
  return output;
}