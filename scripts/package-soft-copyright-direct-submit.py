#!/usr/bin/env python3
"""Assemble and verify the applicant's direct-submit software copyright package."""

from __future__ import annotations

import hashlib
import json
import re
import shutil
import zipfile
from pathlib import Path

from PIL import Image
from pypdf import PdfReader


BASE = Path("/Users/zhuangxiji/Desktop/秦灭六国软著申请")
PACKAGE = BASE / "Codex-最终材料-20260812"
TECH = PACKAGE / "01-正式提交件-技术材料"
PRIVATE = PACKAGE / "03-申请信息与提交指引-含敏感信息"
QA = PACKAGE / "04-QA与校验"
ASSIST = BASE / "00-填报与本人签署-含敏感信息"
UPLOAD = BASE / "00-平台待上传文件-直接提交"
OLD_UPLOAD = BASE / "00-平台待上传文件-补门牌后使用"

SOURCE = TECH / "01-秦灭六国游戏软件-V1.0-源程序鉴别材料.pdf"
MANUAL = TECH / "02-秦灭六国游戏软件-V1.0-软件设计与使用说明书.pdf"
ID_FRONT = PRIVATE / "03-身份证明-按系统要求上传/01-居民身份证正面.jpg"
ID_BACK = PRIVATE / "03-身份证明-按系统要求上传/02-居民身份证反面.jpg"
INFO = PRIVATE / "01-登记申请信息最终填写稿.pdf"
GUIDE = PRIVATE / "02-提交顺序与文件清单.pdf"

PUBLIC_ZIP = BASE / "秦灭六国游戏软件-V1.0-正式技术提交件-20260813.zip"
PRIVATE_ZIP = BASE / "秦灭六国游戏软件-V1.0-本人办理私密包-20260813.zip"
REPORT = QA / "整套提交材料最终验收报告-20260813.json"
CANONICAL_REPORT = QA / "整套提交材料最终验收报告.json"
APPLICANT_QA_REPORT = QA / "申请信息与提交指引验收报告.json"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def pdf_page_size(path: Path) -> tuple[int, list[tuple[float, float]]]:
    reader = PdfReader(path)
    sizes = sorted(
        {
            (round(float(page.mediabox.width), 1), round(float(page.mediabox.height), 1))
            for page in reader.pages
        }
    )
    return len(reader.pages), sizes


def zip_files(path: Path, files: list[tuple[Path, str]]) -> None:
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for source, arcname in files:
            archive.write(source, arcname=arcname)


def main() -> None:
    required = [SOURCE, MANUAL, ID_FRONT, ID_BACK, INFO, GUIDE]
    missing = [str(path) for path in required if not path.is_file()]
    if missing:
        raise FileNotFoundError(f"Missing final files: {missing}")

    UPLOAD.mkdir(parents=True, exist_ok=True)
    upload_map = {
        "01-秦灭六国游戏软件-V1.0-源程序鉴别材料.pdf": SOURCE,
        "02-秦灭六国游戏软件-V1.0-软件设计与使用说明书.pdf": MANUAL,
        "03-居民身份证正面.jpg": ID_FRONT,
        "04-居民身份证反面.jpg": ID_BACK,
    }
    for existing in UPLOAD.iterdir():
        if existing.is_file() and existing.name not in upload_map:
            existing.unlink()
    for name, source in upload_map.items():
        shutil.copy2(source, UPLOAD / name)

    ASSIST.mkdir(parents=True, exist_ok=True)
    shutil.copy2(INFO, ASSIST / INFO.name)
    shutil.copy2(GUIDE, ASSIST / GUIDE.name)

    address_form = ASSIST / "03-通信地址门牌信息-本人本地填写.txt"
    address_text = address_form.read_text(encoding="utf-8")
    required_address_tokens = ["悦来滨江路2号", "嘉悦江庭", "13栋", "1单元", "307室", "401122"]
    address_complete = all(token in address_text for token in required_address_tokens)

    info_text = "\n".join((page.extract_text() or "") for page in PdfReader(INFO).pages)
    info_requirements = {
        "softwareName": "秦灭六国游戏软件" in info_text,
        "version": "V1.0" in info_text,
        "completionDate": all(token in info_text for token in ("2026", "08", "05")),
        "unpublished": "未发表" in info_text,
        "addressRoad": "悦来滨江路" in info_text,
        "addressBuilding": "13 栋" in info_text or "13栋" in info_text,
        "addressUnit": "1 单元" in info_text or "1单元" in info_text,
        "addressRoom": "307 室" in info_text or "307室" in info_text,
        "postCode": "401122" in info_text,
        "noAddressPlaceholder": "补全门牌号" not in info_text and "待本人补充" not in info_text,
    }

    source_pages, source_sizes = pdf_page_size(SOURCE)
    manual_pages, manual_sizes = pdf_page_size(MANUAL)
    info_pages, info_sizes = pdf_page_size(INFO)
    guide_pages, guide_sizes = pdf_page_size(GUIDE)
    a4 = [(595.3, 841.9)]
    with Image.open(ID_FRONT) as image:
        front = {"format": image.format, "pixels": list(image.size), "bytes": ID_FRONT.stat().st_size}
    with Image.open(ID_BACK) as image:
        back = {"format": image.format, "pixels": list(image.size), "bytes": ID_BACK.stat().st_size}

    requirements = {
        "uploadExactlyFourFiles": sorted(path.name for path in UPLOAD.iterdir() if path.is_file()) == sorted(upload_map),
        "uploadCopiesMatchSources": all(sha256(UPLOAD / name) == sha256(source) for name, source in upload_map.items()),
        "source60PagesA4": source_pages == 60 and source_sizes == a4,
        "manual53PagesA4": manual_pages == 53 and manual_sizes == a4,
        "info4PagesA4": info_pages == 4 and info_sizes == a4,
        "guide2PagesA4": guide_pages == 2 and guide_sizes == a4,
        "identityImagesJpegUnder2MiB": front["format"] == "JPEG" and back["format"] == "JPEG" and front["bytes"] < 2 * 1024 * 1024 and back["bytes"] < 2 * 1024 * 1024,
        "addressFormComplete": address_complete,
        "applicationInfoComplete": all(info_requirements.values()),
    }
    if not all(requirements.values()):
        raise RuntimeError(json.dumps({"requirements": requirements, "info": info_requirements}, ensure_ascii=False, indent=2))

    # Compute artifact hashes and write the final report before archiving so the
    # private ZIP contains the same current-state QA record as the outer folder.
    zip_files(PUBLIC_ZIP, [(SOURCE, SOURCE.name), (MANUAL, MANUAL.name)])
    hashes = {
        path.name: sha256(path)
        for path in [SOURCE, MANUAL, ID_FRONT, ID_BACK, INFO, GUIDE, PUBLIC_ZIP]
    }
    report = {
        "result": "通过",
        "application": "秦灭六国游戏软件 V1.0",
        "requirements": requirements,
        "applicationInfoRequirements": info_requirements,
        "pdfs": {
            SOURCE.name: {"pages": source_pages, "pageSizes": source_sizes},
            MANUAL.name: {"pages": manual_pages, "pageSizes": manual_sizes},
            INFO.name: {"pages": info_pages, "pageSizes": info_sizes},
            GUIDE.name: {"pages": guide_pages, "pageSizes": guide_sizes},
        },
        "identityFiles": {ID_FRONT.name: front, ID_BACK.name: back},
        "directUploadDirectory": str(UPLOAD),
        "applicantOnlyActions": ["登录及实名认证", "验证码", "核对法律事实", "本人签名", "最终提交"],
        "sha256": hashes,
    }
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    REPORT.chmod(0o600)
    CANONICAL_REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    CANONICAL_REPORT.chmod(0o600)
    applicant_qa = {
        "result": "通过",
        "requirements": {
            "applicationInfoA4And4Pages": requirements["info4PagesA4"],
            "submissionGuideA4And2Pages": requirements["guide2PagesA4"],
            "applicationInfoComplete": requirements["applicationInfoComplete"],
            "addressFormComplete": requirements["addressFormComplete"],
        },
        "files": {
            INFO.name: {
                "sha256": sha256(INFO),
                "bytes": INFO.stat().st_size,
                "pages": info_pages,
                "pageSizes": info_sizes,
            },
            GUIDE.name: {
                "sha256": sha256(GUIDE),
                "bytes": GUIDE.stat().st_size,
                "pages": guide_pages,
                "pageSizes": guide_sizes,
            },
            INFO.with_suffix(".docx").name: {
                "sha256": sha256(INFO.with_suffix(".docx")),
                "bytes": INFO.with_suffix(".docx").stat().st_size,
            },
            GUIDE.with_suffix(".docx").name: {
                "sha256": sha256(GUIDE.with_suffix(".docx")),
                "bytes": GUIDE.with_suffix(".docx").stat().st_size,
            },
        },
    }
    APPLICANT_QA_REPORT.write_text(json.dumps(applicant_qa, ensure_ascii=False, indent=2), encoding="utf-8")
    APPLICANT_QA_REPORT.chmod(0o600)

    private_files: list[tuple[Path, str]] = []
    for path in sorted(PACKAGE.rglob("*")):
        if path.is_file():
            private_files.append((path, str(PACKAGE.name / path.relative_to(PACKAGE))))
    for path in sorted(UPLOAD.iterdir()):
        if path.is_file():
            private_files.append((path, str(Path(UPLOAD.name) / path.name)))
    for path in sorted(ASSIST.iterdir()):
        if path.is_file():
            private_files.append((path, str(Path(ASSIST.name) / path.name)))
    zip_files(PRIVATE_ZIP, private_files)
    hashes[PRIVATE_ZIP.name] = sha256(PRIVATE_ZIP)

    for zip_path in (PUBLIC_ZIP, PRIVATE_ZIP):
        with zipfile.ZipFile(zip_path) as archive:
            if archive.testzip() is not None:
                raise RuntimeError(f"ZIP integrity failed: {zip_path.name}")
    for path in list(UPLOAD.iterdir()) + list(ASSIST.iterdir()) + [PRIVATE_ZIP]:
        if path.is_file():
            path.chmod(0o600)
    UPLOAD.chmod(0o700)
    ASSIST.chmod(0o700)

    print(json.dumps({
        "result": "passed",
        "directUploadFileCount": len(upload_map),
        "publicZipSha256": hashes[PUBLIC_ZIP.name],
        "privateZipSha256": hashes[PRIVATE_ZIP.name],
        "report": str(REPORT),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
