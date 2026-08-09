from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from time import time


LOG_PATH = Path("D:/FinalProj/debug-f5a6fa.log")
DIAGRAM_DIR = Path("D:/FinalProj/diagrams")


@dataclass(frozen=True)
class Dim:
    w: int
    h: int


def _now_ms() -> int:
    return int(time() * 1000)


def log(hypothesis_id: str, location: str, message: str, data: dict) -> None:
    payload = {
        "sessionId": "f5a6fa",
        "runId": "scale-for-print",
        "hypothesisId": hypothesis_id,
        "location": location,
        "message": message,
        "data": data,
        "timestamp": _now_ms(),
    }
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")


def parse_dim(svg_text: str) -> Dim | None:
    m = re.search(r'\bwidth="(\d+)"\s+height="(\d+)"', svg_text)
    if not m:
        return None
    return Dim(int(m.group(1)), int(m.group(2)))


def replace_dim(svg_text: str, new_dim: Dim) -> str:
    # Replace only the first width/height pair on the <svg ...> tag
    return re.sub(
        r'\bwidth="\d+"\s+height="\d+"',
        f'width="{new_dim.w}" height="{new_dim.h}"',
        svg_text,
        count=1,
    )


def main(scale: float = 2.0) -> None:
    svgs = sorted(DIAGRAM_DIR.glob("fig_*.svg"))
    if not svgs:
        log("H0", "scale_diagrams_for_print.py:main", "No SVG files found", {"dir": str(DIAGRAM_DIR)})
        return

    for p in svgs:
        txt = p.read_text(encoding="utf-8")
        old = parse_dim(txt)
        if not old:
            log("H0", "scale_diagrams_for_print.py:parse", "Missing width/height attributes", {"file": p.name})
            continue

        new = Dim(int(round(old.w * scale)), int(round(old.h * scale)))
        updated = replace_dim(txt, new)
        if updated == txt:
            log("H0", "scale_diagrams_for_print.py:replace", "No change applied (unexpected)", {"file": p.name})
            continue

        p.write_text(updated, encoding="utf-8")
        log(
            "H1",
            "scale_diagrams_for_print.py:main",
            "Scaled SVG width/height for print export",
            {"file": p.name, "scale": scale, "before_px": {"w": old.w, "h": old.h}, "after_px": {"w": new.w, "h": new.h}},
        )


if __name__ == "__main__":
    main()

