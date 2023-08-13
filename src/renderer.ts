import { Vec2, Vec3 } from "wgpu-matrix";
import { Clock } from "./clock";
import { cubeVertices } from "./cube";
import "./index.css";
import cubemapFragmentShader from "./shader/cubemap/frag.wgsl?raw";
import cubemapVertexShader from "./shader/cubemap/vert.wgsl?raw";
import computeShader from "./shader/knot/comp.wgsl?raw";
import fragmentShader from "./shader/knot/frag.wgsl?raw";
import vertexShader from "./shader/knot/vert.wgsl?raw";
import { TrackballControls } from "./trackball-controls";
import { assert, first, generateVertices } from "./utils";

const preferredFormat = navigator.gpu.getPreferredCanvasFormat();

export class Renderer {
  private ctx: GPUCanvasContext;
  private controls: TrackballControls;
  private buffers: ReturnType<Renderer["initBuffers"]>;
  private pipelines: ReturnType<Renderer["initPipelines"]>;
  private textures: ReturnType<Renderer["initTextures"]>;
  private bindGroupLayouts: ReturnType<Renderer["initBindGroupLayouts"]>;
  private bindGroups: ReturnType<Renderer["initBindGroups"]>;
  private renderConfig: GPURenderPassDescriptor;
  private ready = false;

  constructor(
    private device: GPUDevice,
    private options: {
      canvasId: string;
      width: number;
      height: number;
      curve: (_: Vec2) => Vec3;
      culled: boolean;
      cubemapBitmaps: ImageBitmap[];
      fov: number;
    }
  ) {
    this.ctx = this.initCanvasContext();
    this.resizeCanvas(true);
    this.controls = this.initControls();
    this.buffers = this.initBuffers();
    this.textures = this.initTextures();
    this.bindGroupLayouts = this.initBindGroupLayouts();
    this.pipelines = this.initPipelines();
    this.bindGroups = this.initBindGroups();
    this.renderConfig = this.initRenderConfig();
    this.setupEventListeners();
    this.ready = true;
  }

  get canvas() {
    return this.ctx.canvas as HTMLCanvasElement;
  }

  private initCanvasContext() {
    const id = this.options.canvasId;
    const canvas = document.getElementById(id) as HTMLCanvasElement;

    const ctx = canvas.getContext("webgpu");
    assert(ctx, "WebGPU not supported.");

    ctx.configure({
      device: this.device,
      format: preferredFormat,
      alphaMode: "premultiplied",
    });

    return ctx;
  }

  private resizeCanvas(calledFromConstructor = false) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;

    if (calledFromConstructor) return;
    this.textures.depth.destroy();
    this.textures.depth = this.initDepthTexture();
    this.renderConfig.depthStencilAttachment!.view =
      this.textures.depth.createView();

    this.controls.aspect = this.ctx.canvas.width / this.ctx.canvas.height;
  }

  private initControls() {
    const aspect = this.ctx.canvas.width / this.ctx.canvas.height;
    const fov = this.options.fov * (Math.PI / 180);
    return new TrackballControls({ aspect, fov, radius: 10.0 });
  }

  private initBuffers() {
    return {
      curve: this.initCurveBuffer(),
      matrix: this.initMatrixBuffer(),
      cubemap: this.initCubemapBuffer(),
      square: this.initSquareBuffer(),
      size: this.initSizeBuffer(),
      current: this.initCurrentBuffer(),
      next: this.initNextBuffer(),
    };
  }

  private initCurveBuffer() {
    const transform = generateVertices(
      this.options.curve,
      this.options.width,
      this.options.height
    );
    const curveBuffer = this.device.createBuffer({
      size: transform.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(curveBuffer.getMappedRange()).set(transform);
    curveBuffer.unmap();

    return curveBuffer;
  }

  private initMatrixBuffer() {
    return this.device.createBuffer({
      size: 64, // 4x4 matrix
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  private initSquareBuffer() {
    const vertices = new Float32Array([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
    ]);
    const buffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(buffer.getMappedRange()).set(vertices);
    buffer.unmap();

    return buffer;
  }

  private initCubemapBuffer() {
    const cubemapBuffer = this.device.createBuffer({
      size: cubeVertices.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(cubemapBuffer.getMappedRange()).set(cubeVertices);
    cubemapBuffer.unmap();
    return cubemapBuffer;
  }

  private initSizeBuffer() {
    const sizeBuffer = this.device.createBuffer({
      size: 8,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.UNIFORM |
        GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Uint32Array(sizeBuffer.getMappedRange()).set([
      this.options.width,
      this.options.height,
    ]);
    sizeBuffer.unmap();
    return sizeBuffer;
  }

  private initCurrentBuffer() {
    const cells = this.createGame();
    const buffer = this.device.createBuffer({
      size:
        Uint32Array.BYTES_PER_ELEMENT *
        this.options.width *
        this.options.height,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.VERTEX |
        GPUBufferUsage.COPY_SRC,
      mappedAtCreation: true,
    });
    new Uint32Array(buffer.getMappedRange()).set(cells);
    buffer.unmap();
    return buffer;
  }

  private initNextBuffer() {
    return this.device.createBuffer({
      size:
        Uint32Array.BYTES_PER_ELEMENT *
        this.options.width *
        this.options.height,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.VERTEX |
        GPUBufferUsage.COPY_SRC,
    });
  }

  private createGame() {
    const cells = new Uint32Array(this.options.width * this.options.height);
    cells.fill(0);
    for (let i = 0; i < cells.length; i++) {
      cells[i] = Math.random() < 0.25 ? 1 : 0;
    }
    return cells;
  }

  private initPipelines() {
    return {
      compute: this.initComputePipeline(),
      render: this.initRenderPipeline(),
      cubemap: this.initCubemapPipeline(),
    };
  }

  private initComputePipeline() {
    return this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayouts.compute],
      }),
      compute: {
        module: this.device.createShaderModule({
          code: computeShader,
        }),
        entryPoint: "main",
      },
    });
  }

  private initRenderPipeline() {
    return this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayouts.render],
      }),
      vertex: {
        module: this.device.createShaderModule({ code: vertexShader }),
        entryPoint: "main",
        buffers: [
          {
            // square vertices
            stepMode: "vertex",
            arrayStride: 16,
            attributes: [
              {
                offset: 0,
                shaderLocation: 0,
                format: "float32x4",
              },
            ],
          },
          {
            // cell map
            stepMode: "instance",
            arrayStride: 4,
            attributes: [
              {
                offset: 0,
                shaderLocation: 1,
                format: "uint32",
              },
            ],
          },
          {
            // transforms
            stepMode: "instance",
            arrayStride: 60,
            attributes: [
              {
                offset: 0,
                shaderLocation: 2,
                format: "float32x3",
              },
              {
                offset: 12,
                shaderLocation: 3,
                format: "float32x3",
              },
              {
                offset: 24,
                shaderLocation: 4,
                format: "float32x3",
              },
              {
                offset: 36,
                shaderLocation: 5,
                format: "float32x3",
              },
              {
                offset: 48,
                shaderLocation: 6,
                format: "float32x3",
              },
            ],
          },
        ],
      },
      fragment: {
        module: this.device.createShaderModule({
          code: fragmentShader,
        }),
        entryPoint: "main",
        targets: [{ format: preferredFormat }],
      },
      primitive: {
        topology: "triangle-strip",
        cullMode: this.options.culled ? "back" : "none",
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
      },
    });
  }

  private initCubemapPipeline() {
    return this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: this.device.createShaderModule({ code: cubemapVertexShader }),
        entryPoint: "main",
        buffers: [
          {
            arrayStride: 20,
            attributes: [
              {
                // position
                shaderLocation: 0,
                offset: 0,
                format: "float32x3",
              },
              {
                // uv
                shaderLocation: 1,
                offset: 12,
                format: "float32x2",
              },
            ],
          },
        ],
      },
      fragment: {
        module: this.device.createShaderModule({ code: cubemapFragmentShader }),
        entryPoint: "main",
        targets: [{ format: preferredFormat }],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "front",
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
      },
    });
  }

  private initTextures() {
    return {
      depth: this.initDepthTexture(),
      cubemap: this.initCubemapTexture(),
    };
  }

  private initDepthTexture() {
    const { width, height } = this.canvas;
    return this.device.createTexture({
      size: { width, height },
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  private initCubemapTexture() {
    const bitmaps = this.options.cubemapBitmaps;
    const texture = this.device.createTexture({
      dimension: "2d",
      size: {
        width: bitmaps[0].width,
        height: bitmaps[0].height,
        depthOrArrayLayers: bitmaps.length,
      },
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    for (let i = 0; i < bitmaps.length; i++) {
      const bitmap = bitmaps[i];
      this.device.queue.copyExternalImageToTexture(
        { source: bitmap },
        { texture, origin: [0, 0, i] },
        { width: bitmap.width, height: bitmap.height }
      );
    }

    return texture;
  }

  private initBindGroupLayouts() {
    return {
      compute: this.initComputeBindGroupLayout(),
      render: this.initRenderBindGroupLayout(),
    };
  }

  private initComputeBindGroupLayout() {
    return this.device.createBindGroupLayout({
      entries: [
        {
          // size
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" },
        },
        {
          // current
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" },
        },
        {
          // next
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" },
        },
      ],
    });
  }

  private initRenderBindGroupLayout() {
    return this.device.createBindGroupLayout({
      entries: [
        {
          // matrix
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "uniform" },
        },
        {
          // size
          binding: 1,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
      ],
    });
  }

  private initBindGroups() {
    return {
      cubemap: this.initCubemapBindGroup(),
      compute: this.initComputeBindGroup(),
      swapped: this.initSwappedBindGroup(),
      render: this.initRenderBindGroup(),
    };
  }

  private initCubemapBindGroup() {
    const sampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });

    return this.device.createBindGroup({
      layout: this.pipelines.cubemap.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.buffers.matrix },
        },
        {
          binding: 1,
          resource: sampler,
        },
        {
          binding: 2,
          resource: this.textures.cubemap.createView({ dimension: "cube" }),
        },
      ],
    });
  }

  private initComputeBindGroup() {
    return this.device.createBindGroup({
      layout: this.bindGroupLayouts.compute,
      entries: [
        { binding: 0, resource: { buffer: this.buffers.size } },
        { binding: 1, resource: { buffer: this.buffers.current } },
        { binding: 2, resource: { buffer: this.buffers.next } },
      ],
    });
  }

  private initSwappedBindGroup() {
    return this.device.createBindGroup({
      layout: this.bindGroupLayouts.compute,
      entries: [
        { binding: 0, resource: { buffer: this.buffers.size } },
        { binding: 1, resource: { buffer: this.buffers.next } },
        { binding: 2, resource: { buffer: this.buffers.current } },
      ],
    });
  }

  private initRenderBindGroup() {
    return this.device.createBindGroup({
      layout: this.bindGroupLayouts.render,
      entries: [
        { binding: 0, resource: { buffer: this.buffers.matrix } },
        { binding: 1, resource: { buffer: this.buffers.size } },
      ],
    });
  }

  private setupEventListeners() {
    let rotating = false;
    this.canvas.onmousedown = () => (rotating = true);
    this.canvas.onmouseup = () => (rotating = false);
    this.canvas.onmouseleave = () => (rotating = false);
    this.canvas.onmousemove = (e) =>
      rotating &&
      this.controls.rotate(
        (e.movementY / this.canvas.height) * Math.PI,
        (e.movementX / this.canvas.width) * Math.PI,
        0
      );
    this.canvas.onwheel = (e) => this.controls.zoom(e.deltaY / 100);
    const observer = new ResizeObserver(() => this.resizeCanvas());
    observer.observe(this.canvas);
  }

  private initRenderConfig() {
    const colorAttachment: GPURenderPassColorAttachment = {
      loadOp: "clear",
      storeOp: "store",
      view: undefined!,
    };

    return {
      colorAttachments: [colorAttachment],
      depthStencilAttachment: {
        view: this.textures.depth.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    } as GPURenderPassDescriptor;
  }

  public render(updateInterval: number) {
    const clock = new Clock();
    clock.addCooldown("compute", updateInterval);
    clock.start(0);

    let updateCount = 0;

    const colorAttachment = first(this.renderConfig.colorAttachments)!;

    const animate = (now: number) => {
      clock.tick(now);
      const dt = clock.deltaTime;

      // skip frames if tab is inactive (dt > 200ms)
      if (dt > 200) {
        requestAnimationFrame(animate);
        return;
      }

      colorAttachment.view = this.ctx.getCurrentTexture().createView();

      this.controls.rotate(dt * 0.0001, dt * 0.0001, dt * 0.0001);
      const matrix = this.controls.update(dt * 0.01);
      this.device.queue.writeBuffer(
        this.buffers.matrix,
        0,
        matrix.buffer,
        matrix.byteOffset,
        matrix.byteLength
      );

      const encoder = this.device.createCommandEncoder();

      if (clock.ready("compute")) {
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.compute);
        computePass.setBindGroup(
          0,
          updateCount % 2 ? this.bindGroups.swapped : this.bindGroups.compute
        );
        computePass.dispatchWorkgroups(
          Math.ceil(this.options.width / 8),
          Math.ceil(this.options.height / 8)
        );
        computePass.end();
        updateCount++;
      }

      const renderPass = encoder.beginRenderPass(this.renderConfig);

      renderPass.setPipeline(this.pipelines.render);
      renderPass.setVertexBuffer(0, this.buffers.square);
      renderPass.setVertexBuffer(
        1,
        updateCount % 2 ? this.buffers.next : this.buffers.current
      );
      renderPass.setVertexBuffer(2, this.buffers.curve);
      renderPass.setBindGroup(0, this.bindGroups.render);
      renderPass.draw(4, this.options.width * this.options.height);

      renderPass.setPipeline(this.pipelines.cubemap);
      renderPass.setVertexBuffer(0, this.buffers.cubemap);
      renderPass.setBindGroup(0, this.bindGroups.cubemap);
      renderPass.draw(36);

      renderPass.end();

      this.device.queue.submit([encoder.finish()]);

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
}
