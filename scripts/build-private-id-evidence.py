#!/usr/bin/env python3
"""Build private identity uploads from locally verified ID photos.

The script performs only orientation, resampling and A4 composition. It does
not OCR, retouch, redact or alter document content.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen.canvas import Canvas


SOURCE = Path("/Users/zhuangxiji/Desktop/life/important/证件")
PACKAGE = Path("/Users/zhuangxiji/Desktop/秦灭六国软著申请/Codex-最终材料-20260812")
OUT = PACKAGE / "03-申请信息与提交指引-含敏感信息/03-身份证明-按系统要求上传"
FRONT_SOURCE = SOURCE / "zheng.jpeg"
BACK_SOURCE = SOURCE / "fan.jpeg"
FRONT = OUT / "01-居民身份证正面.jpg"
BACK = OUT / "02-居民身份证反面.jpg"
MERGED = OUT / "03-居民身份证正反面合并备用.pdf"
MANIFEST = OUT / "证件文件校验信息.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def normalize(source: Path, output: Path) -> tuple[int, int]:
    image = ImageOps.exif_transpose(Image.open(source)).convert("RGB")
    image.thumbnail((2600, 2600), Image.Resampling.LANCZOS)
    image.save(output, "JPEG", quality=92, optimize=True, progressive=True, dpi=(300, 300))
    return image.size


def draw_image_page(canvas: Canvas, path: Path, label: str) -> None:
    width, height = landscape(A4)
    canvas.setPageSize((width, height))
    canvas.setFillColorRGB(1, 1, 1)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.setFillColorRGB(0.12, 0.18, 0.27)
    canvas.setFont("Helvetica-Bold", 12)
    canvas.drawString(36, height - 34, label)
    with Image.open(path) as image:
        iw, ih = image.size
    max_w, max_h = width - 72, height - 86
    scale = min(max_w / iw, max_h / ih)
    draw_w, draw_h = iw * scale, ih * scale
    x, y = (width - draw_w) / 2, (height - draw_h) / 2 - 5
    canvas.drawImage(ImageReader(str(path)), x, y, draw_w, draw_h, preserveAspectRatio=True, mask="auto")
    canvas.setFillColorRGB(0.35, 0.39, 0.45)
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(width - 36, 18, "Private identity document - upload only when requested")
    canvas.showPage()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    front_size = normalize(FRONT_SOURCE, FRONT)
    back_size = normalize(BACK_SOURCE, BACK)
    canvas = Canvas(str(MERGED), pagesize=landscape(A4), pageCompression=1)
    canvas.setTitle("Applicant identity document")
    canvas.setAuthor("Applicant")
    draw_image_page(canvas, FRONT, "PRC Resident Identity Card - Front")
    draw_image_page(canvas, BACK, "PRC Resident Identity Card - Back")
    canvas.save()
    manifest = {
        "privacy": "仅供申请人办理软件著作权登记，严禁公开传播",
        "verification": {
            "frontMatchedApplicantName": True,
            "frontMatchedApplicantIdNumber": True,
            "backRecognizedAsResidentIdReverse": True,
        },
        "files": {
            FRONT.name: {"pixels": list(front_size), "bytes": FRONT.stat().st_size, "sha256": sha256(FRONT)},
            BACK.name: {"pixels": list(back_size), "bytes": BACK.stat().st_size, "sha256": sha256(BACK)},
            MERGED.name: {"bytes": MERGED.stat().st_size, "sha256": sha256(MERGED)},
        },
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    for path in (FRONT, BACK, MERGED, MANIFEST):
        path.chmod(0o600)
    print(json.dumps({"files": {name: {k: v for k, v in data.items() if k != "sha256"} for name, data in manifest["files"].items()}}, ensure_ascii=False))


if __name__ == "__main__":
    main()
