@binding(0) @group(0) var<uniform> matrix: mat4x4<f32>;

struct Out {
  @builtin(position) pos : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
  @location(1) fragPosition: vec4<f32>,
}

@vertex
fn main(
  @location(0) pos : vec3<f32>,
  @location(1) uv : vec2<f32>
) -> Out {
  var output : Out;
  output.pos = matrix * vec4(pos, 0.01);
  
  output.fragUV = uv;
  output.fragPosition = 0.5 * (vec4(pos, 1.0) + vec4(1.0, 1.0, 1.0, 1.0));
  return output;
}
