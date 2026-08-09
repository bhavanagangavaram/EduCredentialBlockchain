from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from time import time
from xml.etree import ElementTree as ET


LOG_PATH = Path("D:/FinalProj/debug-f5a6fa.log")
DIAGRAM_DIR = Path("D:/FinalProj/diagrams")


@dataclass(frozen=True)
class Size:
    width_px: float
    height_px: float

    def inches(self, dpi: float) -> tuple[float, float]:
        return (self.width_px / dpi, self.height_px / dpi)

    def cm(self, dpi: float) -> tuple[float, float]:
        w_in, h_in = self.inches(dpi)
        return (w_in * 2.54, h_in * 2.54)


def _now_ms() -> int:
    return int(time() * 1000)


def log(hypothesis_id: str, location: str, message: str, data: dict) -> None:
    payload = {
        "sessionId": "f5a6fa",
        "runId": "size-check",
        "hypothesisId": hypothesis_id,
        "location": location,
        "message": message,
        "data": data,
        "timestamp": _now_ms(),
    }
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")


def parse_px(value: str | None) -> float | None:
    if not value:
        return None
    s = value.strip()
    # Accept plain numbers or px values: "1000" or "1000px"
    m = re.fullmatch(r"([0-9]+(?:\.[0-9]+)?)\s*(px)?", s)
    if m:
        return float(m.group(1))
    # If other unit, leave as None (we will fall back to viewBox)
    return None


def get_svg_size(svg_path: Path) -> Size:
    tree = ET.parse(svg_path)
    root = tree.getroot()
    w = parse_px(root.attrib.get("width"))
    h = parse_px(root.attrib.get("height"))
    if w is not None and h is not None:
        return Size(w, h)

    vb = root.attrib.get("viewBox", "")
    parts = vb.strip().split()
    if len(parts) == 4:
        _, _, vb_w, vb_h = parts
        return Size(float(vb_w), float(vb_h))

    raise ValueError(f"Could not determine size for {svg_path.name}")


def main() -> None:
    svgs = sorted(DIAGRAM_DIR.glob("fig_*.svg"))
    if not svgs:
        log("H0", "verify_diagram_sizes.py:main", "No SVG files found", {"dir": str(DIAGRAM_DIR)})
        return

    # Hypotheses:
    # H1: SVGs feel "small" because they are being interpreted at 96dpi/72dpi in the target editor.
    # H2: Some SVGs have smaller native pixel size than others (inconsistent sizing).
    # H3: The aspect ratio makes some figures appear visually smaller (more whitespace).
    dpis = [72.0, 96.0, 150.0, 300.0]

    for p in svgs:
        size = get_svg_size(p)
        per_dpi = {}
        for dpi in dpis:
            w_in, h_in = size.inches(dpi)
            w_cm, h_cm = size.cm(dpi)
            per_dpi[str(int(dpi))] = {
                "in": {"w": round(w_in, 3), "h": round(h_in, 3)},
                "cm": {"w": round(w_cm, 2), "h": round(h_cm, 2)},
            }
        log(
            "H1",
            "verify_diagram_sizes.py:loop",
            "SVG physical size at common DPI assumptions",
            {
                "file": p.name,
                "px": {"w": size.width_px, "h": size.height_px},
                "sizes": per_dpi,
            },
        )

    # Consistency check
    widths = sorted({get_svg_size(p).width_px for p in svgs})
    heights = sorted({get_svg_size(p).height_px for p in svgs})
    log(
        "H2",
        "verify_diagram_sizes.py:main",
        "SVG dimension uniqueness summary",
        {"unique_widths_px": widths, "unique_heights_px": heights, "count": len(svgs)},
    )


if __name__ == "__main__":
    main()

