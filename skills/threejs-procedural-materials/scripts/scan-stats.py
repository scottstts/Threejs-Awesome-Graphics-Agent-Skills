#!/usr/bin/env python3
"""scan-stats.py: measure PBR texture maps before using them in a shader.

Why: thresholds, masks, and normalisations written against assumed value ranges silently break.
A factor normalised by an assumed mean several times off the real one clamps everywhere. Measure first.

Usage:
  python3 scan-stats.py textures/rock-basecolor.jpg textures/rock-roughness.jpg textures/rock-normal.jpg ...
  python3 scan-stats.py --self-test

The map type is inferred from the file name (basecolor | albedo | diffuse, roughness, normal,
height | displacement, ao, metalness, opacity). Per-map output:
  - basecolor: sRGB and linear mean, percentiles 1/5/50/95/99 of linear luminance, saturation;
  - roughness / ao / height / metalness / opacity: value distribution (0-1);
  - normal: mean XY (near 0.5, 0.5 in encoded space -> 0, 0 unpacked) and Z range; tilted mean flags
    wrong color space or encoding. Check OpenGL (+Y) vs DirectX (-Y) green visually under raking light;
  - all: tiling seam score (edge mismatch vs interior neighbour difference; > ~1.5 flags a visible seam)
    and resolution.
Requires Python 3, Pillow, and NumPy.
"""
import sys
import json
import numpy as np
from PIL import Image


def srgb_to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def seam_score(a):
    a = a.astype(np.float64)
    if a.ndim == 3:
        a = a.mean(axis=2)
    lr = np.abs(a[:, 0] - a[:, -1]).mean()
    tb = np.abs(a[0, :] - a[-1, :]).mean()
    inner_x = np.abs(np.diff(a, axis=1)).mean() + 1e-9
    inner_y = np.abs(np.diff(a, axis=0)).mean() + 1e-9
    return round(float(max(lr / inner_x, tb / inner_y)), 2)


def pct(x):
    return {f"p{p}": round(float(np.percentile(x, p)), 4) for p in (1, 5, 50, 95, 99)}


def kind_of(path):
    n = path.lower()
    for k, pats in [
        ("basecolor", ["basecolor", "albedo", "diffuse", "color"]),
        ("normal", ["normal"]),
        ("roughness", ["rough"]),
        ("height", ["height", "disp"]),
        ("ao", ["-ao", "_ao", "ambientocclusion", "occlusion"]),
        ("metalness", ["metal"]),
        ("opacity", ["opacity", "alpha", "mask"]),
    ]:
        if any(p in n for p in pats):
            return k
    return "unknown"


def stats(path, arr=None, kind=None):
    if arr is None:
        arr = np.asarray(Image.open(path).convert("RGB"), dtype=np.float64) / 255.0
    kind = kind or kind_of(path)
    out = {
        "file": path,
        "kind": kind,
        "size": [int(arr.shape[1]), int(arr.shape[0])],
        "seam": seam_score(arr),
    }
    if kind == "basecolor":
        lin = srgb_to_linear(arr)
        lum = lin @ np.array([0.2126, 0.7152, 0.0722])
        mx, mn = arr.max(axis=2), arr.min(axis=2)
        sat = np.where(mx > 1e-6, (mx - mn) / np.maximum(mx, 1e-6), 0)
        out.update(
            {
                "srgbMean": [round(float(v), 4) for v in arr.reshape(-1, 3).mean(0)],
                "linearMean": [round(float(v), 4) for v in lin.reshape(-1, 3).mean(0)],
                "linearLuminance": {"mean": round(float(lum.mean()), 4), **pct(lum)},
                "saturationMean": round(float(sat.mean()), 4),
            }
        )
        if lum.mean() > 0.85 or lum.mean() < 0.02:
            out["warning"] = (
                "mean linear albedo outside real-surface range (~0.02 charcoal to ~0.85 fresh snow): "
                "verify colorSpace or scale intentionally in shader"
            )
    elif kind == "normal":
        n = arr * 2 - 1
        out.update(
            {
                "meanXY": [round(float(n[..., 0].mean()), 4), round(float(n[..., 1].mean()), 4)],
                "zRange": [round(float(n[..., 2].min()), 3), round(float(n[..., 2].max()), 3)],
            }
        )
        if abs(n[..., 0].mean()) > 0.08 or abs(n[..., 1].mean()) > 0.08:
            out["warning"] = (
                "mean normal is tilted: verify tangent-space format and ensure linear (NoColorSpace) loading"
            )
    else:
        v = arr.mean(axis=2)
        out.update({"mean": round(float(v.mean()), 4), "std": round(float(v.std()), 4), **pct(v)})
        if kind == "roughness" and (v.max() - v.min()) < 0.05:
            out["warning"] = "nearly constant roughness map: verify linear data loading and surface detail"
    return out


def self_test():
    rng = np.random.default_rng(1)
    base = np.clip(0.45 + 0.1 * rng.standard_normal((64, 64, 3)), 0, 1)
    s = stats("x-basecolor.png", base)
    assert s["kind"] == "basecolor" and 0.1 < s["linearLuminance"]["mean"] < 0.3, s
    flat = np.zeros((64, 64, 3))
    flat[..., 0] = 0.5
    flat[..., 1] = 0.5
    flat[..., 2] = 1.0
    n = stats("x-normal.png", flat)
    assert abs(n["meanXY"][0]) < 0.01 and "warning" not in n, n
    seam = np.tile(np.linspace(0, 1, 64), (64, 1))[..., None].repeat(3, 2)
    assert stats("x-roughness.png", seam)["seam"] > 5, "seam not detected"
    tile = np.tile(0.5 + 0.2 * np.sin(np.linspace(0, 2 * np.pi, 64, endpoint=False)), (64, 1))[..., None].repeat(3, 2)
    assert stats("x-roughness.png", tile)["seam"] < 1.6, "periodic map flagged as seamed"
    print("scan-stats self-test passed")


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help"):
        print(__doc__)
        sys.exit(0)
    if args[0] == "--self-test":
        self_test()
        sys.exit(0)
    print(json.dumps([stats(p) for p in args], indent=2))
