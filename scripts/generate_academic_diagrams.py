from pathlib import Path
import html
import json
from time import time


ROOT = Path("D:/FinalProj")
OUT_DIR = ROOT / "diagrams"
OUT_DIR.mkdir(exist_ok=True)
LOG_PATH = ROOT / "debug-f5a6fa.log"

FONT = "'Times New Roman', serif"
STROKE = "#4B5563"
TEXT = "#111827"
MUTED = "#6B7280"
BLUE = "#DCE6F2"
GREEN = "#EAF2E3"
AMBER = "#F6EAD8"
YELLOW = "#F7F1D3"
GRAY = "#E5E7EB"


def esc(value: str) -> str:
    return html.escape(str(value), quote=True)

def dlog(hypothesis_id: str, location: str, message: str, data: dict) -> None:
    payload = {
        "sessionId": "f5a6fa",
        "runId": "diagram-geometry",
        "hypothesisId": hypothesis_id,
        "location": location,
        "message": message,
        "data": data,
        "timestamp": int(time() * 1000),
    }
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")


def svg_doc(width, height, body):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}" role="img" aria-label="Academic project diagram">'
        f"<defs>"
        f'<marker id="arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
        f'<path d="M 0 0 L 10 5 L 0 10 z" fill="{STROKE}"/>'
        f"</marker>"
        f'<style>'
        f'.title{{font:700 20px {FONT};fill:{TEXT};}}'
        f'.caption{{font:700 15px {FONT};fill:{TEXT};}}'
        f'.boxtext{{font:700 15px {FONT};fill:{TEXT};text-anchor:middle;dominant-baseline:middle;}}'
        f'.small{{font:400 12px {FONT};fill:{MUTED};text-anchor:middle;dominant-baseline:middle;}}'
        f'.label{{font:700 13px {FONT};fill:{TEXT};}}'
        f'.layer{{font:700 12px {FONT};fill:{MUTED};letter-spacing:1px;}}'
        f'.entity{{font:700 14px {FONT};fill:{TEXT};text-anchor:middle;dominant-baseline:middle;}}'
        f'.edge{{stroke:{STROKE};stroke-width:2.2;fill:none;marker-end:url(#arrow);}}'
        f'.dash{{stroke:{STROKE};stroke-width:2;fill:none;stroke-dasharray:8 6;marker-end:url(#arrow);}}'
        f'.outline{{stroke:{STROKE};stroke-width:2.2;fill:white;}}'
        f'.blue{{fill:{BLUE};stroke:{STROKE};stroke-width:2.2;}}'
        f'.green{{fill:{GREEN};stroke:{STROKE};stroke-width:2.2;}}'
        f'.amber{{fill:{AMBER};stroke:{STROKE};stroke-width:2.2;}}'
        f'.yellow{{fill:{YELLOW};stroke:{STROKE};stroke-width:2.2;}}'
        f'.gray{{fill:{GRAY};stroke:{STROKE};stroke-width:2.2;}}'
        f".thin{{stroke:{STROKE};stroke-width:1.4;fill:none;}}"
        f"</style>"
        f"</defs>"
        f'<rect x="1" y="1" width="{width-2}" height="{height-2}" fill="white"/>'
        f"{body}</svg>"
    )


def rect(x, y, w, h, cls="outline", rx=8):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" class="{cls}"/>'


def database(x, y, w, h, cls="outline"):
    rx = w / 2
    cy_top = y + 12
    cy_bottom = y + h - 12
    return (
        # Top front arc only (prevents line crossing through text area)
        f'<path d="M {x} {cy_top} A {rx} 12 0 0 1 {x + w} {cy_top}" class="{cls}"/>'
        # Side walls only (avoid center strike-through line across text)
        f'<line x1="{x}" y1="{cy_top}" x2="{x}" y2="{cy_bottom}" class="{cls}"/>'
        f'<line x1="{x + w}" y1="{cy_top}" x2="{x + w}" y2="{cy_bottom}" class="{cls}"/>'
        # Bottom front arc only
        f'<path d="M {x} {cy_bottom} A {rx} 12 0 0 0 {x + w} {cy_bottom}" class="{cls}"/>'
    )


def pill(x, y, w, h, cls="gray"):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2}" class="{cls}"/>'


def diamond(cx, cy, w, h, cls="yellow"):
    x1, y1 = cx, cy - h / 2
    x2, y2 = cx + w / 2, cy
    x3, y3 = cx, cy + h / 2
    x4, y4 = cx - w / 2, cy
    return f'<polygon points="{x1},{y1} {x2},{y2} {x3},{y3} {x4},{y4}" class="{cls}"/>'

def diamond_vertices(cx, cy, w, h):
    # top, right, bottom, left
    return {
        "top": (cx, cy - h / 2),
        "right": (cx + w / 2, cy),
        "bottom": (cx, cy + h / 2),
        "left": (cx - w / 2, cy),
    }

def path_d(d: str, cls="edge"):
    return f'<path d="{d}" class="{cls}"/>'


def text_center(x, y, value, cls="boxtext"):
    return f'<text x="{x}" y="{y}" class="{cls}">{esc(value)}</text>'


def multiline_center(x, y, lines, gap=18, main_cls="boxtext", small_cls="small"):
    out = []
    start = y - (len(lines) - 1) * gap / 2
    for idx, (content, cls) in enumerate(lines):
        out.append(f'<text x="{x}" y="{start + idx * gap}" class="{cls}">{esc(content)}</text>')
    return "".join(out)


def line(x1, y1, x2, y2, cls="edge"):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" class="{cls}"/>'


def label(x, y, value, anchor="start"):
    return f'<text x="{x}" y="{y}" class="label" text-anchor="{anchor}">{esc(value)}</text>'


def figure_caption(width, y, text):
    return f'<text x="{width/2}" y="{y}" class="caption" text-anchor="middle">{esc(text)}</text>'


def layer_block(y, label_text, items):
    x = 90
    width = 820
    height = 102
    parts = [
        rect(x, y, width, height, cls="outline", rx=14),
        f'<text x="{x + 18}" y="{y + 24}" class="layer">{esc(label_text)}</text>',
    ]
    item_w = 165
    gap = 20
    total_w = len(items) * item_w + (len(items) - 1) * gap
    start_x = x + (width - total_w) / 2
    item_y = y + 34
    for i, item in enumerate(items):
        box_x = start_x + i * (item_w + gap)
        shape = item.get("shape", "rect")
        cls = item.get("cls", "outline")
        if shape == "db":
            parts.append(database(box_x, item_y, item_w, 48, cls=cls))
            cy = item_y + 24
        else:
            parts.append(rect(box_x, item_y, item_w, 48, cls=cls))
            cy = item_y + 24
        lines = [(item["title"], "boxtext")]
        subtitle = item.get("subtitle")
        if subtitle:
            lines.append((subtitle, "small"))
        parts.append(multiline_center(box_x + item_w / 2, cy, lines, gap=17))
    return "".join(parts)


def fig_3_7():
    body = ['<text x="500" y="42" class="title" text-anchor="middle">System Architecture</text>']
    body.append(layer_block(70, "CLIENT LAYER", [
        {"title": "Frontend", "subtitle": "Next.js DApp", "cls": "blue"},
        {"title": "MetaMask", "subtitle": "Wallet Access"},
        {"title": "Face Recognition", "subtitle": "face-api.js"},
        {"title": "RSA Encryption", "subtitle": "JSEncrypt"},
    ]))
    body.append(line(500, 172, 500, 214))
    body.append(layer_block(214, "SERVICE LAYER", [
        {"title": "Backend API", "subtitle": "Express + SQLite"},
        {"title": "OTP Service", "subtitle": "Email + SMS"},
        {"title": "AI Server", "subtitle": "FastAPI / CV"},
        {"title": "Booth Mode", "subtitle": "Admin Assisted"},
    ]))
    body.append(line(500, 316, 500, 358))
    body.append(layer_block(358, "BLOCKCHAIN LAYER", [
        {"title": "Voting Contract", "subtitle": "Voting.sol", "cls": "blue"},
        {"title": "Ethereum", "subtitle": "Encrypted Votes", "shape": "db"},
    ]))
    body.append(line(500, 460, 500, 502))
    body.append(layer_block(502, "STORAGE & KEY MANAGEMENT", [
        {"title": "SQLite Database", "subtitle": "Voter Profiles", "shape": "db"},
        {"title": "SSS Shares", "subtitle": "3 of 5 Threshold"},
        {"title": "Result Tally", "subtitle": "Off-chain Decryption"},
    ]))
    body.append(figure_caption(1000, 646, "Fig 3.7: System Architecture"))
    return svg_doc(1000, 680, "".join(body))


def fig_4_0():
    body = ['<text x="500" y="42" class="title" text-anchor="middle">Voting Process Flowchart</text>']
    body.append(pill(410, 64, 180, 48, "gray"))
    body.append(text_center(500, 88, "START"))

    steps = [
        ("Access Web Interface", "blue", None),
        ("Connect Wallet", "blue", "MetaMask"),
        ("OTP Verification", "blue", "Email + SMS"),
        ("Face Authentication", "blue", "Live CNN Check"),
    ]
    y = 144
    centers = []
    for title, cls, sub in steps:
        body.append(rect(310, y, 380, 56, cls=cls, rx=6))
        lines = [(title, "boxtext")]
        if sub:
            lines.append((sub, "small"))
        body.append(multiline_center(500, y + 28, lines, gap=17))
        centers.append((500, y, y + 56))
        y += 92

    dia_cx, dia_cy, dia_w, dia_h = 500, 538, 240, 110
    body.append(diamond(dia_cx, dia_cy, dia_w, dia_h, "yellow"))
    body.append(multiline_center(dia_cx, dia_cy, [("Authentication", "boxtext"), ("successful?", "small")], gap=18))
    v = diamond_vertices(dia_cx, dia_cy, dia_w, dia_h)
    dlog("H1", "generate_academic_diagrams.py:fig_4_0", "Diamond vertices", {"figure": "4.0", **{k: {"x": p[0], "y": p[1]} for k, p in v.items()}})

    body.append(rect(160, 650, 280, 56, cls="green", rx=6))
    body.append(text_center(300, 678, "Select Candidate"))
    body.append(rect(160, 742, 280, 56, cls="green", rx=6))
    body.append(multiline_center(300, 770, [("Encrypt Vote", "boxtext"), ("Client-side RSA", "small")], gap=18))
    body.append(rect(160, 834, 280, 56, cls="green", rx=6))
    body.append(multiline_center(300, 862, [("Submit Vote", "boxtext"), ("Ethereum Transaction", "small")], gap=18))
    body.append(rect(160, 926, 280, 56, cls="green", rx=6))
    body.append(multiline_center(300, 954, [("Store Encrypted Vote", "boxtext"), ("Immutable On-chain Record", "small")], gap=18))
    body.append(pill(220, 1022, 160, 46, "gray"))
    body.append(text_center(300, 1045, "END"))

    body.append(rect(610, 650, 250, 56, cls="amber", rx=6))
    body.append(text_center(735, 678, "Reject Access"))

    body.append(line(500, 112, 500, 144))
    body.append(line(500, 200, 500, 236))
    body.append(line(500, 292, 500, 328))
    body.append(line(500, 384, 500, 420))
    body.append(line(500, 476, 500, 483))
    # Branch connectors MUST originate from left/right diamond vertices.
    yes_box_top = (300, 650)  # top center of first YES box (x=160,w=280)
    no_box_top = (735, 650)   # top center of NO box (x=610,w=250)
    # YES: left vertex -> small elbow -> top of YES box
    body.append(path_d(f"M {v['left'][0]} {v['left'][1]} L {yes_box_top[0]} {yes_box_top[1]}", "edge"))
    # NO: right vertex -> straight to above NO box -> down to NO box top
    body.append(path_d(f"M {v['right'][0]} {v['right'][1]} L {no_box_top[0]} {v['right'][1]} L {no_box_top[0]} {no_box_top[1]}", "edge"))
    dlog("H1", "generate_academic_diagrams.py:fig_4_0", "Diamond branch endpoints", {"figure": "4.0", "yes_to": {"x": yes_box_top[0], "y": yes_box_top[1]}, "no_to": {"x": no_box_top[0], "y": no_box_top[1]}})
    body.append(line(300, 706, 300, 742))
    body.append(line(300, 798, 300, 834))
    body.append(line(300, 890, 300, 926))
    body.append(line(300, 982, 300, 1022))
    # Do not strike through the page: route NO path to END with a clean elbow.
    end_center = (300, 1045)
    reject_bottom = (735, 706)  # bottom center of reject box (y=650,h=56)
    body.append(path_d(f"M {reject_bottom[0]} {reject_bottom[1]} L {reject_bottom[0]} 980 L {end_center[0]} 980 L {end_center[0]} 1022", "dash"))
    dlog("H2", "generate_academic_diagrams.py:fig_4_0", "NO path routed to END", {"figure": "4.0", "from": {"x": reject_bottom[0], "y": reject_bottom[1]}, "to": {"x": end_center[0], "y": 1022}})

    body.append(label(392, 632, "YES", anchor="end"))
    body.append(label(634, 528, "NO"))
    body.append(figure_caption(1000, 1158, "Fig 4.0: System Flowchart"))
    return svg_doc(1000, 1190, "".join(body))


def fig_4_1():
    body = ['<text x="500" y="42" class="title" text-anchor="middle">Context Level DFD</text>']
    body.append(rect(365, 210, 270, 92, cls="blue", rx=10))
    body.append(multiline_center(500, 256, [("AI-Integrated E-Voting", "boxtext"), ("System", "boxtext")], gap=18))

    body.append(rect(90, 210, 170, 70, cls="outline", rx=10))
    body.append(text_center(175, 245, "Voter", "entity"))
    body.append(rect(740, 210, 170, 70, cls="outline", rx=10))
    body.append(text_center(825, 245, "Admin", "entity"))
    body.append(database(385, 390, 230, 78, cls="outline"))
    body.append(multiline_center(500, 429, [("Ethereum Blockchain", "boxtext"), ("Encrypted Votes + Records", "small")], gap=18))

    # Use orthogonal arrows with cleaner spacing around labels.
    body.append(path_d("M 260 240 L 365 240", "edge"))
    body.append(path_d("M 365 272 L 260 272", "edge"))
    body.append(path_d("M 740 240 L 635 240", "edge"))
    body.append(path_d("M 635 272 L 740 272", "edge"))
    body.append(path_d("M 500 302 L 500 390", "edge"))
    body.append(path_d("M 520 390 L 520 302", "edge"))

    body.append(label(304, 222, "Authentication data", anchor="middle"))
    body.append(label(304, 298, "Vote receipt / status", anchor="middle"))
    body.append(label(696, 222, "Election setup", anchor="middle"))
    body.append(label(696, 298, "Results / reports", anchor="middle"))
    body.append(label(560, 350, "Read / write transactions"))
    body.append(figure_caption(1000, 546, "Fig 4.1: Context DFD"))
    return svg_doc(1000, 580, "".join(body))


def fig_4_2():
    body = ['<text x="500" y="42" class="title" text-anchor="middle">Level 1 DFD</text>']
    xs = [140, 320, 500, 680, 860]
    labels = [
        ("1.0", "Registration", "Admin Input"),
        ("2.0", "Authentication", "Wallet + OTP + Face"),
        ("3.0", "Encryption", "RSA-2048"),
        ("4.0", "AI Monitor", "Coercion Detection"),
        ("5.0", "Blockchain", "Vote Storage"),
    ]
    colors = ["blue", "blue", "green", "outline", "outline"]
    for i, (x, (n, t1, t2)) in enumerate(zip(xs, labels)):
        cls = colors[i]
        if t1 == "Blockchain":
            body.append(database(x - 70, 234, 140, 86, cls="outline"))
            body.append(multiline_center(x, 281, [(t1, "boxtext"), (t2, "small")], gap=18))
        else:
            body.append(rect(x - 78, 228, 156, 86, cls=cls, rx=10))
            body.append(multiline_center(x, 271, [(n, "small"), (t1, "boxtext"), (t2, "small")], gap=18))

    body.append(rect(70, 120, 140, 54, cls="outline", rx=10))
    body.append(text_center(140, 147, "Admin", "entity"))
    body.append(rect(70, 408, 140, 54, cls="outline", rx=10))
    body.append(text_center(140, 435, "Voter", "entity"))
    body.append(database(770, 404, 180, 86, cls="outline"))
    body.append(multiline_center(860, 451, [("SQLite / Logs", "boxtext"), ("Profiles + Audit Data", "small")], gap=18))
    body.append(rect(500 - 80, 408, 160, 58, cls="green", rx=10))
    body.append(multiline_center(500, 437, [("6.0 Result Tally", "boxtext"), ("SSS Reconstruction", "small")], gap=18))

    for x1, x2 in zip(xs[:-1], xs[1:]):
        body.append(line(x1 + 78, 271, x2 - 78, 271))

    body.append(line(140, 174, 140, 228))
    body.append(line(140, 435, 242, 435))
    body.append(line(422, 314, 422, 408))
    body.append(line(578, 314, 578, 408))
    # Route to blockchain from top to avoid striking through blockchain text.
    body.append(path_d("M 758 271 L 790 271", "edge"))
    body.append(path_d("M 320 314 L 260 350 L 180 408", "dash"))
    body.append(path_d("M 680 314 L 760 360 L 860 408", "dash"))

    body.append(label(222, 137, "Registration data"))
    body.append(label(270, 420, "Credentials"))
    body.append(label(422, 372, "Verified identity", anchor="middle"))
    body.append(label(578, 372, "Encrypted ballot", anchor="middle"))
    body.append(label(840, 348, "Stored vote"))
    body.append(label(260, 365, "Profile update"))
    body.append(label(874, 402, "Monitoring / audit", anchor="middle"))
    body.append(figure_caption(1000, 544, "Fig 4.2: Level 1 DFD"))
    return svg_doc(1000, 580, "".join(body))


def fig_4_3():
    body = []
    body.append(pill(410, 40, 180, 48, "gray"))
    body.append(text_center(500, 64, "START"))
    blocks = [
        ("Connect Wallet", None),
        ("Verify Registration", None),
        ("Verify OTP", None),
        ("Verify Face Identity", None),
        ("Select Candidate", None),
        ("Encrypt and Submit Vote", "RSA-2048 + Ethereum"),
    ]
    y = 118
    for title, sub in blocks:
        body.append(rect(320, y, 360, 56, cls="blue" if "Verify" in title else "green", rx=6))
        lines = [(title, "boxtext")]
        if sub:
            lines.append((sub, "small"))
        body.append(multiline_center(500, y + 28, lines, gap=18))
        y += 86

    body.append(pill(410, 644, 180, 48, "gray"))
    body.append(text_center(500, 668, "END"))

    body.append(line(500, 88, 500, 118))
    body.append(line(500, 174, 500, 204))
    body.append(line(500, 260, 500, 290))
    body.append(line(500, 346, 500, 376))
    body.append(line(500, 432, 500, 462))
    # Enter final process box from top edge; exit from bottom edge to END
    body.append(line(500, 518, 500, 548))
    body.append(line(500, 604, 500, 644))
    return svg_doc(1000, 730, "".join(body))


def fig_4_3_1_use_case():
    body = []
    # System boundary
    body.append(rect(250, 50, 500, 520, cls="outline", rx=12))
    body.append(label(500, 76, "AI-Integrated E-Voting System", anchor="middle"))

    # Actors
    body.append(rect(70, 190, 130, 64, cls="outline", rx=10))
    body.append(text_center(135, 222, "Voter", "entity"))
    body.append(rect(800, 190, 130, 64, cls="outline", rx=10))
    body.append(text_center(865, 222, "Admin", "entity"))

    # Use cases (ellipses)
    use_cases = [
        (500, 150, "Connect Wallet"),
        (500, 215, "Verify Identity"),
        (500, 280, "Submit OTP"),
        (500, 345, "Cast Encrypted Vote"),
        (500, 410, "View Receipt"),
        (500, 485, "Register Voter"),
        (500, 535, "Manage Candidates"),
    ]
    for cx, cy, txt in use_cases:
        body.append(f'<ellipse cx="{cx}" cy="{cy}" rx="135" ry="24" class="outline"/>')
        body.append(text_center(cx, cy, txt))

    # Associations
    for y in [150, 215, 280, 345, 410]:
        body.append(line(200, 222, 365, y, cls="thin"))
    for y in [485, 535, 215]:
        body.append(line(800, 222, 635, y, cls="thin"))

    return svg_doc(1000, 620, "".join(body))


def fig_4_3_2_sequence():
    body = []

    lanes = [
        ("Voter", 120),
        ("Frontend", 300),
        ("OTP Service", 500),
        ("Smart Contract", 700),
        ("Blockchain", 880),
    ]
    for name, x in lanes:
        body.append(rect(x - 65, 40, 130, 42, cls="blue" if name == "Frontend" else "outline", rx=8))
        body.append(text_center(x, 61, name))
        body.append(line(x, 82, x, 580, cls="dash"))

    msgs = [
        (120, 300, 110, "Connect wallet"),
        (300, 500, 165, "Send OTP request"),
        (500, 300, 210, "OTP delivered"),
        (120, 300, 255, "Enter OTP + face"),
        (300, 700, 310, "vote(encryptedBallot)"),
        (700, 880, 370, "Store transaction"),
        (880, 300, 430, "Tx confirmation"),
        (300, 120, 485, "Show receipt"),
    ]
    for x1, x2, y, txt in msgs:
        body.append(line(x1, y, x2, y))
        body.append(label((x1 + x2) / 2, y - 10, txt, anchor="middle"))

    return svg_doc(1000, 620, "".join(body))


def fig_4_3_3_class():
    body = []

    def class_box(x, y, w, h, name, attrs, ops):
        parts = [rect(x, y, w, h, cls="outline", rx=4)]
        parts.append(line(x, y + 38, x + w, y + 38, cls="thin"))
        parts.append(line(x, y + 110, x + w, y + 110, cls="thin"))
        parts.append(text_center(x + w / 2, y + 19, name))
        for i, a in enumerate(attrs):
            parts.append(f'<text x="{x + 12}" y="{y + 60 + i * 24}" class="label" text-anchor="start">{esc(a)}</text>')
        for i, o in enumerate(ops):
            parts.append(f'<text x="{x + 12}" y="{y + 136 + i * 24}" class="label" text-anchor="start">{esc(o)}</text>')
        return "".join(parts)

    # Vertical, readable class flow inspired by reference.
    x = 330
    w = 340
    body.append(class_box(x, 40,  w, 205, "DataSet", ["- dataId: string", "- dataSource: string"], ["+ uploadData()", "+ validateData()"]))
    body.append(class_box(x, 270, w, 205, "Training", ["- trainingId: string", "- algorithm: string"], ["+ startTraining()", "+ evaluateModel()"]))
    body.append(class_box(x, 500, w, 205, "ModelSelection", ["- modelId: string", "- modelType: string"], ["+ selectModel()", "+ compareModels()"]))
    body.append(class_box(x, 730, w, 185, "Prediction", ["- predictionId: string"], ["+ makePrediction(inputData)", "+ evaluatePrediction()"]))

    # Straight association lines + labels (no overlap).
    cx = x + w / 2
    body.append(path_d(f"M {cx} 245 L {cx} 270", "edge"))
    body.append(label(cx + 40, 260, "prepares"))
    body.append(path_d(f"M {cx} 475 L {cx} 500", "edge"))
    body.append(label(cx + 40, 490, "produces"))
    body.append(path_d(f"M {cx} 705 L {cx} 730", "edge"))
    body.append(label(cx + 40, 720, "generates"))

    return svg_doc(1000, 950, "".join(body))


def fig_4_3_4_collaboration():
    body = ['<text x="500" y="42" class="title" text-anchor="middle">Collaboration Diagram</text>']

    # Structured collaboration view similar to your reference style.
    body.append(rect(40, 90, 920, 440, cls="outline", rx=10))
    body.append(database(45, 95, 150, 90, cls="amber"))
    body.append(text_center(120, 140, "Dataset Upload"))
    body.append(rect(40, 370, 150, 80, cls="green", rx=12))
    body.append(text_center(115, 410, "Preprocessing"))

    body.append(rect(250, 220, 200, 120, cls="blue", rx=12))
    body.append(multiline_center(350, 280, [("Data Management", "boxtext"), ("System", "boxtext")], gap=20))

    body.append(rect(550, 240, 180, 100, cls="amber", rx=12))
    body.append(text_center(640, 290, "Model Training"))

    body.append(rect(560, 95, 190, 100, cls="outline", rx=12))
    body.append(multiline_center(655, 145, [("Model Selection", "boxtext"), ("& Evaluation", "boxtext")], gap=20))

    body.append(rect(780, 240, 150, 100, cls="outline", rx=12))
    body.append(multiline_center(855, 290, [("Prediction/", "boxtext"), ("Inference", "boxtext")], gap=20))

    # Non-overlapping orthogonal arrows + labels
    body.append(path_d("M 195 145 L 250 250", "edge"))
    body.append(label(226, 206, "Raw Data", anchor="middle"))
    body.append(path_d("M 190 410 L 250 310", "edge"))
    body.append(label(226, 355, "Clean Data", anchor="middle"))
    body.append(path_d("M 450 280 L 550 280", "edge"))
    body.append(label(500, 266, "Training Data", anchor="middle"))
    body.append(path_d("M 640 240 L 640 195", "edge"))
    body.append(label(666, 216, "Model Metrics"))
    body.append(path_d("M 730 290 L 780 290", "edge"))
    body.append(label(755, 276, "Selected Model", anchor="middle"))

    body.append(figure_caption(1000, 578, "Fig 4.3.4: Collaboration Diagram"))
    return svg_doc(1000, 610, "".join(body))


def fig_4_3_5_activity():
    body = fig_4_3()
    return body.replace("Fig 4.3: Activity Diagram", "Fig 4.3.5: Activity Diagram")


def fig_4_4():
    body = ['<text x="500" y="42" class="title" text-anchor="middle">Anti-Coercion Monitoring</text>']
    body.append(rect(330, 88, 340, 58, cls="blue", rx=6))
    body.append(multiline_center(500, 117, [("Capture Webcam Frame", "boxtext"), ("Continuous Monitoring", "small")], gap=18))
    d1_cx, d1_cy, d1_w, d1_h = 500, 246, 250, 112
    body.append(diamond(d1_cx, d1_cy, d1_w, d1_h, "yellow"))
    body.append(multiline_center(d1_cx, d1_cy, [("Multiple faces", "boxtext"), ("detected?", "small")], gap=18))
    v1 = diamond_vertices(d1_cx, d1_cy, d1_w, d1_h)
    dlog("H3", "generate_academic_diagrams.py:fig_4_4", "Diamond1 vertices", {"figure": "4.4", "diamond": 1, **{k: {"x": p[0], "y": p[1]} for k, p in v1.items()}})

    body.append(rect(170, 360, 260, 56, cls="green", rx=6))
    body.append(text_center(300, 388, "Continue Voting"))
    body.append(rect(570, 360, 260, 56, cls="amber", rx=6))
    body.append(multiline_center(700, 388, [("Trigger Lockout", "boxtext"), ("Alert Admin / End Session", "small")], gap=18))

    body.append(rect(330, 506, 340, 58, cls="outline", rx=6))
    body.append(multiline_center(500, 535, [("Identity switch or", "boxtext"), ("face absence check", "boxtext")], gap=18))
    d2_cx, d2_cy, d2_w, d2_h = 500, 656, 250, 112
    body.append(diamond(d2_cx, d2_cy, d2_w, d2_h, "yellow"))
    body.append(multiline_center(d2_cx, d2_cy, [("Violation persists", "boxtext"), ("for 5 seconds?", "small")], gap=18))
    v2 = diamond_vertices(d2_cx, d2_cy, d2_w, d2_h)
    dlog("H3", "generate_academic_diagrams.py:fig_4_4", "Diamond2 vertices", {"figure": "4.4", "diamond": 2, **{k: {"x": p[0], "y": p[1]} for k, p in v2.items()}})
    body.append(rect(170, 772, 260, 56, cls="green", rx=6))
    body.append(text_center(300, 800, "Reset Grace Timer"))
    body.append(rect(570, 772, 260, 56, cls="amber", rx=6))
    body.append(multiline_center(700, 800, [("Lock Voting Session", "boxtext"), ("Preserve Audit Evidence", "small")], gap=18))

    # Connector routing (no center-branching from diamonds):
    # Top box -> diamond1 top vertex
    body.append(path_d(f"M 500 146 L {v1['top'][0]} {v1['top'][1]}", "edge"))
    # Diamond1 left vertex -> Continue Voting (top center)
    cont_top = (300, 360)
    # Left branch in right-angle style to match documentation standards.
    body.append(path_d(f"M {v1['left'][0]} {v1['left'][1]} L 380 {v1['left'][1]} L 380 {cont_top[1]} L {cont_top[0]} {cont_top[1]}", "edge"))
    # Diamond1 right vertex -> Trigger Lockout (top center)
    lock_top = (700, 360)
    body.append(path_d(f"M {v1['right'][0]} {v1['right'][1]} L {lock_top[0]} {v1['right'][1]} L {lock_top[0]} {lock_top[1]}", "edge"))
    # Continue / Lockout -> identity check (dashed monitoring path, stops at box top)
    id_top_y = 506
    body.append(path_d(f"M {cont_top[0]} 416 L {cont_top[0]} {id_top_y}", "dash"))
    body.append(path_d(f"M {lock_top[0]} 416 L {lock_top[0]} {id_top_y}", "dash"))
    # Identity check -> diamond2 top vertex
    body.append(path_d(f"M 500 564 L {v2['top'][0]} {v2['top'][1]}", "edge"))
    # Diamond2 left vertex -> Reset Grace Timer (top center)
    reset_top = (300, 772)
    body.append(path_d(f"M {v2['left'][0]} {v2['left'][1]} L 380 {v2['left'][1]} L 380 {reset_top[1]} L {reset_top[0]} {reset_top[1]}", "edge"))
    # Diamond2 right vertex -> Lock Voting Session (top center)
    lock2_top = (700, 772)
    body.append(path_d(f"M {v2['right'][0]} {v2['right'][1]} L {lock2_top[0]} {v2['right'][1]} L {lock2_top[0]} {lock2_top[1]}", "edge"))
    dlog("H4", "generate_academic_diagrams.py:fig_4_4", "Diamond branch endpoints", {"figure": "4.4", "d1_yes": {"x": lock_top[0], "y": lock_top[1]}, "d1_no": {"x": cont_top[0], "y": cont_top[1]}, "d2_yes": {"x": lock2_top[0], "y": lock2_top[1]}, "d2_no": {"x": reset_top[0], "y": reset_top[1]}})

    body.append(label(390, 342, "NO", anchor="middle"))
    body.append(label(616, 238, "YES"))
    body.append(label(390, 754, "NO", anchor="middle"))
    body.append(label(616, 648, "YES"))
    body.append(figure_caption(1000, 910, "Fig 4.4: Anti-Coercion Diagram"))
    return svg_doc(1000, 950, "".join(body))


def write_preview():
    html_text = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Academic Diagram Preview</title>
  <style>
    body { margin: 0; padding: 32px; background: #f7f7f7; font-family: "Times New Roman", serif; color: #111827; }
    h1 { text-align: center; margin: 0 0 28px; font-size: 28px; }
    .figure { background: white; border: 1px solid #d1d5db; border-radius: 10px; margin: 0 auto 28px; max-width: 1040px; padding: 20px; box-shadow: 0 4px 16px rgba(17,24,39,0.06); }
    .figure img { width: 100%; height: auto; display: block; }
  </style>
</head>
<body>
  <h1>Professional SVG Diagram Set</h1>
  <div class="figure"><img src="./fig_3_7_system_architecture.svg" alt="Fig 3.7 System Architecture"></div>
  <div class="figure"><img src="./fig_4_0_system_flowchart.svg" alt="Fig 4.0 System Flowchart"></div>
  <div class="figure"><img src="./fig_4_1_context_dfd.svg" alt="Fig 4.1 Context DFD"></div>
  <div class="figure"><img src="./fig_4_2_level_1_dfd.svg" alt="Fig 4.2 Level 1 DFD"></div>
  <div class="figure"><img src="./fig_4_3_1_use_case_diagram.svg" alt="Fig 4.3.1 Use Case Diagram"></div>
  <div class="figure"><img src="./fig_4_3_2_sequence_diagram.svg" alt="Fig 4.3.2 Sequence Diagram"></div>
  <div class="figure"><img src="./fig_4_3_3_class_diagram.svg" alt="Fig 4.3.3 Class Diagram"></div>
  <div class="figure"><img src="./fig_4_3_4_collaboration_diagram.svg" alt="Fig 4.3.4 Collaboration Diagram"></div>
  <div class="figure"><img src="./fig_4_3_5_activity_diagram.svg" alt="Fig 4.3.5 Activity Diagram"></div>
  <div class="figure"><img src="./fig_4_4_anti_coercion_diagram.svg" alt="Fig 4.4 Anti-Coercion Diagram"></div>
</body>
</html>
"""
    (OUT_DIR / "all_diagrams.html").write_text(html_text, encoding="utf-8")


def main():
    files = {
        "fig_3_7_system_architecture.svg": fig_3_7(),
        "fig_4_0_system_flowchart.svg": fig_4_0(),
        "fig_4_1_context_dfd.svg": fig_4_1(),
        "fig_4_2_level_1_dfd.svg": fig_4_2(),
        "fig_4_3_1_use_case_diagram.svg": fig_4_3_1_use_case(),
        "fig_4_3_2_sequence_diagram.svg": fig_4_3_2_sequence(),
        "fig_4_3_3_class_diagram.svg": fig_4_3_3_class(),
        "fig_4_3_4_collaboration_diagram.svg": fig_4_3_4_collaboration(),
        "fig_4_3_5_activity_diagram.svg": fig_4_3_5_activity(),
        "fig_4_3_activity_diagram.svg": fig_4_3(),  # retained for compatibility
        "fig_4_4_anti_coercion_diagram.svg": fig_4_4(),
    }
    for name, content in files.items():
        (OUT_DIR / name).write_text(content, encoding="utf-8")
    write_preview()
    print(f"Generated {len(files)} SVG diagrams in {OUT_DIR}")


if __name__ == "__main__":
    main()
