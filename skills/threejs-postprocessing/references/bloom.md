# Bloom

Bloom communicates exceptional brightness. It should not be a global blur.

## Tuning order

1. Establish correct HDR material/light values.
2. Set threshold so ordinary whites and UI do not bloom.
3. Adjust strength for visible but controlled contribution.
4. Adjust radius for scale and atmosphere.
5. Recheck exposure and tone mapping.
6. Test dark and bright backgrounds.

## Selective strategies

- luminance threshold from real HDR values;
- material/layer mask;
- separate scene or render target;
- effect-specific selection support.

Choose the strategy compatible with the pipeline. Avoid darkening non-bloom objects as an ad hoc approach unless state restoration is complete and measured.

## Failure modes

- every bright surface blooms: threshold or exposure is wrong;
- colored fringes overpower shape: strength/radius too high;
- scene looks foggy: bloom is substituting for lighting;
- bloom disappears after grading: ordering or tone mapping issue;
- transparent particles produce blocks: alpha and blending mismatch;
- mobile cost spikes: resolution and blur taps too high.

## Acceptance

Bloom should remain meaningful when reduced by half. If the scene collapses visually without bloom, fix the underlying composition, lighting, or materials.
