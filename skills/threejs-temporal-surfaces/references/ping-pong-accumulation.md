# Ping-pong accumulation

## Minimal state owner

```js
class PingPongTarget {
  constructor(width, height, options) {
    this.read = new THREE.WebGLRenderTarget(width, height, options)
    this.write = new THREE.WebGLRenderTarget(width, height, options)
  }

  swap() {
    ;[this.read, this.write] = [this.write, this.read]
  }

  setSize(width, height) {
    this.read.setSize(width, height)
    this.write.setSize(width, height)
    this.needsClear = true
  }

  dispose() {
    this.read.dispose()
    this.write.dispose()
  }
}
```

## Update shader

The state update should express:

```text
next = clamp(previous * decay + source * deposition + diffusion, 0, 1)
```

Example fragment logic:

```glsl
float previous = texture(tHistory, vUv).r;
float distanceToPointer = length((vUv - pointerUv) * aspectCorrection);
float source = 1.0 - smoothstep(innerRadius, outerRadius, distanceToPointer);
source *= pointerDown;

float structure = texture(tStructure, vUv).r;
float deposited = source * mix(0.35, 1.0, structure);
float nextState = clamp(previous * exp(-decayPerSecond * dt) + deposited, 0.0, 1.0);

outColor = vec4(nextState, 0.0, 0.0, 1.0);
```

Use frame-rate-independent exponential decay.

## Render sequence

```js
updateMaterial.uniforms.tHistory.value = state.read.texture
renderer.setRenderTarget(state.write)
renderer.render(updateScene, orthoCamera)
state.swap()
renderer.setRenderTarget(null)
```

Never sample the texture currently attached for writing.

## Multi-resolution composition

For frost-like effects:

1. render scene color at display resolution;
2. render vertical blur at 0.25–0.5 scale;
3. render horizontal blur at the same scale;
4. update the persistent interaction mask;
5. composite scene, blur, frost structure, highlight structure, and mask;
6. apply a separate output normal/refraction pass if needed.

The mask determines where the optical treatment appears. Static textures determine its internal crystalline character.

## Edge-aware source shaping

Prevent interaction deposits from clipping harshly at viewport edges:

```glsl
vec2 edgeDistance = min(vUv, 1.0 - vUv);
float edgeMask = smoothstep(edgeMin, edgeMax, min(edgeDistance.x, edgeDistance.y));
source *= edgeMask;
```

## World/UV accumulation

Screen-space history moves with the camera. For footprints, terrain wetness, or damage:

- render sources into a world-aligned simulation texture;
- store a world-to-UV transform;
- update only dirty regions when the field is large;
- use tiled state for open worlds.

## Reset conditions

Clear both targets when:

- dimensions change;
- UV/world transform changes;
- camera teleport invalidates a screen-space field;
- the controlled object changes;
- the effect is disabled and later re-enabled with a clean-state expectation.

## Debug views

Expose:

```text
previous state
current source/deposition
decay contribution
diffusion contribution
next unclamped state
final state
world/UV projection coordinates
blur input and output
composite mask
reset generation ID
```

Add a pause-and-single-step control. It should be possible to inspect one update without camera or source motion changing underneath it.
