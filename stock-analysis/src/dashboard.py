"""Render the dashboard: inject analysis JSON into the HTML/JS template.

All charts are hand-rolled SVG/canvas in template.html - no plotting
library payload, so the page stays under ~1MB and opens instantly.
"""

from __future__ import annotations

import json
from pathlib import Path

TEMPLATE = Path(__file__).parent / "template.html"


def build_dashboard_html(analysis: dict, out_path: str) -> None:
    html = TEMPLATE.read_text()
    payload = json.dumps(analysis, separators=(",", ":"))
    html = html.replace("__DATA_JSON__", payload)
    Path(out_path).write_text(html)
