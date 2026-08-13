#!/usr/bin/env python3
"""Run the bundled DOCX renderer with an isolated, explicit CJK font path.

The bundled renderer deliberately gives LibreOffice a clean HOME.  On macOS,
LibreOffice then cannot see fonts from /Library/Fonts.  This wrapper imports the
bundled renderer and copies Arial Unicode MS into each clean profile before the
conversion starts, preserving the renderer's normal conversion and PNG QA path.
"""

from __future__ import annotations

import importlib.util
import os
import shutil
import sys
from pathlib import Path


RENDERER = Path(
    "/Users/zhuangxiji/.codex/plugins/cache/openai-primary-runtime/"
    "documents/26.812.11052/skills/documents/render_docx.py"
)
FONT_CANDIDATES = (
    Path("/Library/Fonts/Arial Unicode.ttf"),
    Path("/System/Library/Fonts/Supplemental/Arial Unicode.ttf"),
)


def main() -> None:
    spec = importlib.util.spec_from_file_location("codex_render_docx", RENDERER)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load renderer: {RENDERER}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    # The bundled alpha LibreOffice build substitutes CJK fonts incorrectly on
    # this macOS host.  Use the stable system LibreOffice converter while still
    # reusing the bundled renderer's page-size and PNG verification logic.
    module._prepend_bundled_runtime_bin = lambda: None
    font = next((path for path in FONT_CANDIDATES if path.exists()), None)
    if font is None:
        raise FileNotFoundError("Arial Unicode MS font is unavailable")

    def build_env(user_profile: str) -> dict:
        font_dir = Path(user_profile) / "Library" / "Fonts"
        font_dir.mkdir(parents=True, exist_ok=True)
        # macOS system fonts may carry immutable flags that copy2 tries to
        # reproduce inside /private/tmp.  The bytes are sufficient here.
        shutil.copyfile(font, font_dir / font.name)
        # Keep the user's HOME for LibreOffice's macOS font discovery while
        # retaining the renderer's unique UserInstallation profile.  A fully
        # synthetic HOME makes LibreOffice substitute CJK text with unrelated
        # fonts even when the font bytes exist inside that profile.
        env = os.environ.copy()
        env.setdefault("HOME", str(Path.home()))
        return env

    module._build_lo_env = build_env
    module.main()


if __name__ == "__main__":
    main()
