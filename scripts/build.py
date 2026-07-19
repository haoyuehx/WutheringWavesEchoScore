#!/usr/bin/env python3
"""Build the static GitHub Pages artifact and bundle score templates."""

from __future__ import annotations

import json
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / "score-templates"
PUBLIC_FILES = ("index.html", "styles.css", "empty-state.css", "app.js", "favicon.png", "LICENSE")


def load_templates() -> dict:
    characters: dict[str, dict] = {}
    for directory in sorted(TEMPLATES.iterdir()):
        if not directory.is_dir():
            continue
        files = {}
        for path in sorted(directory.glob("*.json")):
            files[path.name] = json.loads(path.read_text(encoding="utf-8"))
        if "calc.json" in files:
            characters[directory.name] = files
    if "default" not in characters:
        raise RuntimeError("score-templates/default/calc.json is required")
    return {"schemaVersion": 1, "characters": characters}


def build(destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    for name in PUBLIC_FILES:
        shutil.copy2(ROOT / name, destination / name)
    data = destination / "data"
    data.mkdir(exist_ok=True)
    output = data / "scores.json"
    output.write_text(json.dumps(load_templates(), ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    proxy_url = os.environ.get("KURO_PROXY_URL", "").strip().rstrip("/")
    config = f"globalThis.ECHO_SCORE_CONFIG=Object.freeze({{apiBase:{json.dumps(proxy_url)}}});\n"
    (destination / "config.js").write_text(config, encoding="utf-8")
    (destination / ".nojekyll").touch()
    print(f"Built {destination} ({output.stat().st_size} byte score bundle)")


if __name__ == "__main__":
    target = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / ".pages-site"
    build(target)
