import { mat4, quat, vec3 } from "wgpu-matrix";

export class TrackballControls {
  private currentRotation = quat.identity();
  private targetRotation = quat.identity();
  private perspectiveViewMatrix = mat4.create();
  public projectionMatrix = mat4.create();
  private perspective = mat4.create();

  constructor(
    private options: { fov: number; aspect: number; radius: number }
  ) {
    this.updatePerspectiveView();
    this.updateProjection();
  }

  set aspect(aspect: number) {
    this.options.aspect = aspect;
    this.updatePerspectiveView();
  }

  set radius(radius: number) {
    this.options.radius = radius;
    this.updatePerspectiveView();
  }

  update(dt: number) {
    quat.slerp(
      this.currentRotation,
      this.targetRotation,
      dt,
      this.currentRotation
    );
    this.updateProjection();
    return this.projectionMatrix as Float32Array;
  }

  zoom(delta: number) {
    this.radius = Math.min(Math.max(this.options.radius + delta, 1), 100);
  }

  rotate(dx: number, dy: number, dz: number) {
    const movement = quat.fromEuler(dx, dy, dz, "xyz");
    quat.multiply(movement, this.targetRotation, this.targetRotation);
  }

  private updatePerspectiveView() {
    mat4.perspective(
      this.options.fov,
      this.options.aspect,
      0.1,
      1000,
      this.perspective
    );

    const eye = vec3.create(0, 0, this.options.radius);
    const up = vec3.create(0, 1, 0);
    const target = vec3.create(0, 0, 0);

    const view = mat4.lookAt(eye, target, up);

    mat4.multiply(this.perspective, view, this.perspectiveViewMatrix);
  }

  private updateProjection() {
    const model = mat4.fromQuat(this.currentRotation);
    mat4.multiply(this.perspectiveViewMatrix, model, this.projectionMatrix);
  }
}
