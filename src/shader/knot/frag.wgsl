@binding(1) @group(0) var<uniform> size : vec2<u32>;
@binding(2) @group(0) var<storage, read> current: array<u32>;
@binding(3) @group(0) var<storage, read_write> next: array<u32>;

@fragment
fn main(
  @location(0) cell: f32,
  @location(1) color: vec3<f32>,
) -> @location(0) vec4<f32> {
  return vec4(cell * color, 1.0);
}
