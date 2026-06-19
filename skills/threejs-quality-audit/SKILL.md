---
name: threejs-quality-audit
description: "Audit Three.js and React Three Fiber work for technical correctness, visual quality, performance, accessibility, responsive behavior, interaction, game feel, asset quality, and release readiness. Use when reviewing an implementation, prioritizing improvements, validating a polished or production-ready claim, investigating a vague “make it better” request, or preparing a 3D experience for delivery."
---

# Three.js Quality Audit

Report evidence and prioritize the defects that most limit the intended experience.

## Workflow

1. Establish intended audience, devices, visual target, interaction loop, and release criteria.
2. Inspect code, dependencies, assets, architecture, and existing diagnostics.
3. Run the project and capture representative active states, not only a title or idle view.
4. Check console errors, renderer metrics, frame behavior, loading, resize, input, and teardown.
5. Score technical, visual, performance, usability, and playability dimensions.
6. Separate correctness defects from taste improvements.
7. Rank findings by user impact, risk, and dependency order.
8. Re-test after fixes using the same evidence.

## Finding format

For each actionable issue, provide:

- severity and affected user;
- concrete evidence;
- root cause or strongest hypothesis;
- smallest durable fix;
- verification method.

## Claim discipline

- “Polished” requires coherent visual direction and interaction feedback.
- “Production-ready” requires error handling, teardown, responsive behavior, accessibility, and measured performance.
- “Premium” or “showcase” requires authored forms and materials, active-state evidence, and no critical readability or playability failures.

Read [references/audit-checklist.md](references/audit-checklist.md), [references/visual-scorecard.md](references/visual-scorecard.md), and [references/playtest-release.md](references/playtest-release.md).
