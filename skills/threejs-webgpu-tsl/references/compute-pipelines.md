# Compute pipelines

## Good candidates

- large independent particle updates;
- image or volume processing;
- GPU-generated instance transforms;
- cellular fields and simulations with local neighborhoods;
- culling or indirect data preparation when supported.

Ordinary entity rules, UI state, branching gameplay, and small arrays usually belong on the CPU.

## Design checklist

- element count and stride;
- storage buffer byte size;
- workgroup size;
- invocation bounds check;
- read/write hazards;
- ping-pong buffers where needed;
- initialization pass;
- update pass;
- render consumption;
- reset and disposal;
- optional readback frequency.

## Numerical and synchronization rules

- Never assume dispatch size exactly matches element count.
- Keep cross-workgroup algorithms explicit; a workgroup barrier is not a global barrier.
- Avoid in-place neighbor updates when order would affect results; use separate input/output buffers.
- Bound velocities, densities, and iterative solvers.
- Keep timestep and substep policy explicit.

## Performance

Compute is not free. Profile:

- dispatch overhead;
- buffer upload and readback;
- bandwidth;
- occupancy/workgroup size;
- dependent render passes;
- synchronization stalls.

The best result often leaves authoritative gameplay on CPU while compute owns visual simulation.
