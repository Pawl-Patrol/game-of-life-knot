import cubemapNegX from "./cubemap/nx.png";
import cubemapNegY from "./cubemap/ny.png";
import cubemapNegZ from "./cubemap/nz.png";
import cubemapPosX from "./cubemap/px.png";
import cubemapPosY from "./cubemap/py.png";
import cubemapPosZ from "./cubemap/pz.png";
import { moebiusStrip, trefoilKnot } from "./curves";
import "./index.css";
import { Renderer } from "./renderer";
import { assert, fetchBitmaps } from "./utils";

async function main() {
  assert(navigator.gpu, "WebGPU not supported.");
  const adapter = await navigator.gpu.requestAdapter();
  assert(adapter, "Couldn't request WebGPU adapter.");
  const device = await adapter.requestDevice();

  const bitmaps = await fetchBitmaps(
    cubemapPosX,
    cubemapNegX,
    cubemapPosY,
    cubemapNegY,
    cubemapPosZ,
    cubemapNegZ
  );

  const renderer1 = new Renderer(device, {
    canvasId: "surface-1",
    width: 300,
    height: 40,
    curve: trefoilKnot(1, 0.5),
    culled: true,
    cubemapBitmaps: bitmaps,
    fov: 45,
  });

  const renderer2 = new Renderer(device, {
    canvasId: "surface-2",
    width: 300,
    height: 40,
    curve: moebiusStrip,
    culled: false,
    cubemapBitmaps: bitmaps,
    fov: 45,
  });

  renderer1.render(1000);
  renderer2.render(1000);
}

main();
