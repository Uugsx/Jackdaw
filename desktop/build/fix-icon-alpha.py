#!/usr/bin/env python3
"""Remove baked-in light corners from Jackdaw app icons (RGB → RGBA).

Windows shortcuts show a white square when the source PNG has no alpha channel
and light gray fills the squircle corners.
"""

from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

from PIL import Image


def is_bg_strict(r: int, g: int, b: int) -> bool:
    mx, mn = max(r, g, b), min(r, g, b)
    return mx >= 238 and mx - mn <= 18


def is_bg_loose(r: int, g: int, b: int) -> bool:
    mx, mn = max(r, g, b), min(r, g, b)
    return mx >= 190 and mx - mn <= 35


def soften_edge_alpha(px, width: int, height: int) -> None:
    offsets = ((-1, 0), (1, 0), (0, -1), (0, 1))
    for _ in range(2):
        changes: list[tuple[int, int, tuple[int, int, int, int]]] = []
        for y in range(height):
            for x in range(width):
                r, g, b, a = px[x, y]
                if a == 0:
                    continue
                if not any(
                    0 <= x + dx < width and 0 <= y + dy < height and px[x + dx, y + dy][3] == 0
                    for dx, dy in offsets
                ):
                    continue
                mx, mn = max(r, g, b), min(r, g, b)
                if mx >= 170 and mx - mn <= 45:
                    lum = (r + g + b) / 3
                    alpha = int(max(0, min(255, (235 - lum) * 6)))
                    if alpha < 255:
                        changes.append((x, y, (r, g, b, alpha)))
        for x, y, rgba in changes:
            px[x, y] = rgba


def fix_icon_alpha(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    width, height = image.size
    px = image.load()
    visited = [[False] * width for _ in range(height)]
    queue: deque[tuple[int, int]] = deque()

    corner_size = max(24, width // 12)
    seeds = [
        (x, y)
        for x in range(corner_size)
        for y in range(corner_size)
    ] + [
        (x, y)
        for x in range(width - corner_size, width)
        for y in range(corner_size)
    ] + [
        (x, y)
        for x in range(corner_size)
        for y in range(height - corner_size, height)
    ] + [
        (x, y)
        for x in range(width - corner_size, width)
        for y in range(height - corner_size, height)
    ]

    for x, y in seeds:
        if is_bg_strict(*px[x, y][:3]):
            visited[y][x] = True
            queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        r, g, b, _ = px[x, y]
        px[x, y] = (r, g, b, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < width and 0 <= ny < height and not visited[ny][nx]:
                if is_bg_loose(*px[nx, ny][:3]):
                    visited[ny][nx] = True
                    queue.append((nx, ny))

    soften_edge_alpha(px, width, height)
    image.save(path, optimize=True)
    print(f"fixed {path}")


def main(argv: list[str]) -> int:
    paths = [Path(p) for p in argv[1:]] if len(argv) > 1 else [
        Path(__file__).with_name("icon-jackdaw.png"),
        Path(__file__).with_name("icon-jackdaw-source.png"),
        Path(__file__).with_name("icon.png"),
    ]
    for path in paths:
        if not path.is_file():
            print(f"skip missing {path}", file=sys.stderr)
            continue
        fix_icon_alpha(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
