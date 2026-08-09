from __future__ import annotations

import json
from pathlib import Path
from time import time

import cairosvg


ROOT = Path("D:/FinalProj")
SVG_DIR = ROOT / "diagrams"
PNG_DIR = ROOT / "diagrams" / "png"
LOG_PATH = ROOT / "debug-f5a6fa.log"


def _now_ms() -> int:
    return int(time() * 1000)


def log(hypothesis_id: str, location: str, message: str, data: dict) -> None:
    payload = {
        "sessionId": "f5a6fa",
        "runId": "png-export",
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
        log("H0", "export_diagrams_png.py:main", "No SVGs found", {"dir": str(SVG_DIR)})
        return

    # Target: ~16cm wide in Word. If exported at 300 DPI: 16cm = 6.299in => ~1890px.
    # Use 1900px width for consistent placement.
    target_width_px = 1900
    target_dpi = 300

    for svg in svgs:
        png_path = PNG_DIR / (svg.stem + ".png")
        cairosvg.svg2png(
            url=str(svg),
            write_to=str(png_path),
            output_width=target_width_px,
            dpi=target_dpi,
        )
        log(
            "H5",
            "export_diagrams_png.py:loop",
            "Exported PNG at fixed width",
            {
                "svg": svg.name,
                "png": str(png_path),
                "output_width_px": target_width_px,
                "dpi": target_dpi,
            },
        )


if __name__ == "__main__":
    main()

