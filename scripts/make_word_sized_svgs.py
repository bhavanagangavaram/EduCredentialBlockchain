from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from time import time


LOG_PATH = Path("D:/FinalProj/debug-f5a6fa.log")
IN_DIR = Path("D:/FinalProj/diagrams")
OUT_DIR = Path("D:/FinalProj/diagrams/word-sized")


@dataclass(frozen=True)
class ViewBox:
    w: float
    h: float


def _now_ms() -> int:
    return int(time() * 1000)


def log(hypothesis_id: str, location: str, message: str, data: dict) -> None:
    payload = {
        "sessionId": "f5a6fa",
        "runId": "word-sized",
        "hypothesisId": hypothesis_id,
        "location": location,
        "message": message,
        "data": data,
        "timestamp": _now_ms(),
    }
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")


def parse_viewbox(svg_text: str) -> ViewBox | None:
    m = re.search(r'\bviewBox="([^"]+)"', svg_text)
    if not m:
        return None
    parts = m.group(1).strip().split()
    if len(parts) != 4:
        return None
    try:
        w = float(parts[2])
        h = float(parts[3])
        return ViewBox(w=w, h=h)
    except ValueError:
        return None


def replace_size(svg_text: str, width_cm: float) -> str:
    vb = parse_viewbox(svg_text)
    if not vb:
        raise ValueError("Missing/invalid viewBox")
    height_cm = width_cm * (vb.h / vb.w)

    # Hypothesis H3: some tools ignore px sizing but respect physical units.
    # Replace the first width/height attributes on the <svg ...> tag with cm units.
    updated = re.sub(
        r'\bwidth="[^"]+"\s+height="[^"]+"',
        f'width="{width_cm:.2f}cm" height="{height_cm:.2f}cm"',
        svg_text,
        count=1,
    )
    return updated


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    svgs = sorted(IN_DIR.glob("fig_*.svg"))
    if not svgs:
        log("H0", "make_word_sized_svgs.py:main", "No SVGs found", {"dir": str(IN_DIR)})
        return

    # Target width: A4 printable area ≈ 16cm (fits 1-inch margins roughly).
    target_w_cm = 16.0

    for p in svgs:
        txt = p.read_text(encoding="utf-8")
        vb = parse_viewbox(txt)
        if not vb:
            log("H0", "make_word_sized_svgs.py:parse", "Missing viewBox", {"file": p.name})
            continue

        out = replace_size(txt, target_w_cm)
        out_path = OUT_DIR / p.name
        out_path.write_text(out, encoding="utf-8")
        log(
            "H3",
            "make_word_sized_svgs.py:main",
            "Wrote word-sized SVG with cm units",
            {
                "file": p.name,
                "out": str(out_path),
                "target_width_cm": target_w_cm,
                "computed_height_cm": round(target_w_cm * (vb.h / vb.w), 2),
                "viewBox": {"w": vb.w, "h": vb.h},
            },
        )


if __name__ == "__main__":
    main()

