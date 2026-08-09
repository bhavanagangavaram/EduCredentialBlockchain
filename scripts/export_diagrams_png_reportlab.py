from __future__ import annotations

import json
from pathlib import Path
from time import time

from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM


ROOT = Path("D:/FinalProj")
SVG_DIR = ROOT / "diagrams"
PNG_DIR = ROOT / "diagrams" / "png"
LOG_PATH = ROOT / "debug-f5a6fa.log"


def _now_ms() -> int:
    return int(time() * 1000)


def log(hypothesis_id: str, location: str, message: str, data: dict) -> None:
    payload = {
        "sessionId": "f5a6fa",
        "runId": "png-export-rl",
        "hypothesisId": hypothesis_id,
        "location": location,
        "message": message,
        "data": data,
        "timestamp": _now_ms(),
    }
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")


def main() -> None:
    PNG_DIR.mkdir(parents=True, exist_ok=True)
    svgs = sorted(SVG_DIR.glob("fig_*.svg"))
    if not svgs:
        log("H0", "export_diagrams_png_reportlab.py:main", "No SVGs found", {"dir": str(SVG_DIR)})
        return

    # Target: 16cm wide ≈ 6.299in. At 300dpi => 1890px. Use 1900px.
    target_width_px = 1900
    dpi = 300

    for svg in svgs:
        try:
            drawing = svg2rlg(str(svg))
            if drawing is None:
                raise RuntimeError("svg2rlg returned None")

            # ReportLab drawings are in points (1pt = 1/72in). Current width in points:
            current_w_pt = float(getattr(drawing, "width", 0) or 0)
            current_h_pt = float(getattr(drawing, "height", 0) or 0)
            if current_w_pt <= 0 or current_h_pt <= 0:
                raise RuntimeError(f"Invalid drawing size: {current_w_pt}x{current_h_pt}pt")

            # Convert desired pixel width to points at the chosen dpi:
            # pixels = inches*dpi; points = inches*72 => points = pixels*72/dpi
            target_w_pt = target_width_px * 72.0 / dpi
            scale = target_w_pt / current_w_pt

            drawing.scale(scale, scale)
            drawing.width = current_w_pt * scale
            drawing.height = current_h_pt * scale

            png_path = PNG_DIR / (svg.stem + ".png")
            renderPM.drawToFile(drawing, str(png_path), fmt="PNG", dpi=dpi)

            log(
                "H6",
                "export_diagrams_png_reportlab.py:loop",
                "Exported PNG via reportlab",
                {
                    "svg": svg.name,
                    "png": str(png_path),
                    "dpi": dpi,
                    "target_width_px": target_width_px,
                    "drawing_pt_before": {"w": current_w_pt, "h": current_h_pt},
                    "scale": round(scale, 4),
                    "drawing_pt_after": {"w": round(drawing.width, 2), "h": round(drawing.height, 2)},
                },
            )
        except Exception as e:
            log(
                "H6",
                "export_diagrams_png_reportlab.py:loop",
                "PNG export failed",
                {"svg": svg.name, "error": str(e)},
            )


if __name__ == "__main__":
    main()

