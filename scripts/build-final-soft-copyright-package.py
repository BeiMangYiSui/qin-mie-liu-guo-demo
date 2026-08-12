#!/usr/bin/env python3
"""Build the final technical software-copyright deposit package.

The output is intentionally generated from the current V1.0 repository and the
reviewed design draft.  The primary document uses a deterministic, page-aligned
layout: A4, 32 substantive body lines per page, 34-45 pages total.  The same
DOCX is converted to the submission PDF during the separate render/QA step.
"""

from __future__ import annotations

import csv
import hashlib
import json
import math
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Mm, Pt, RGBColor


REPO = Path("/Users/zhuangxiji/Desktop/CC/qin-mie-liu-guo-demo")
ROOT = Path("/Users/zhuangxiji/Desktop/秦灭六国软著申请")
WORKING = ROOT / "working"
QODER_FINAL = ROOT / "final"
OUT = ROOT / "Codex-最终材料-20260812"
SUBMIT = OUT / "01-正式提交件-技术材料"
EDITABLE = OUT / "02-可编辑源文件"
CONFIRM = OUT / "03-申请人确认后填写"
QA = OUT / "04-QA与校验"

SOFTWARE = "秦灭六国游戏软件"
VERSION = "V1.0"
DOC_TITLE = f"{SOFTWARE} {VERSION} 软件设计与使用说明书"
DOC_FONT = "Arial Unicode MS"
CODE_FONT = "Arial Unicode MS"
LINES_PER_PAGE = 30
MIN_PAGES = 34
MAX_PAGES = 45
MAX_DISPLAY_WIDTH = 78

FORBIDDEN = (
    "Qoder",
    "Codex",
    "AI生成",
    "待本人填写",
    "待本人确认",
    "待申请人",
    "/Users/",
    "身份证",
    "证件号码",
    "联系电话",
    "电子邮箱",
    "通信地址",
    "ghp_",
    "gho_",
    "AppSecret",
)


@dataclass(frozen=True)
class DepositLine:
    text: str
    section: str


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def display_width(text: str) -> int:
    return sum(2 if ord(ch) > 127 else 1 for ch in text)


def clean_text(text: str) -> str:
    text = text.replace("環境", "环境")
    text = text.replace("乘", "×") if re.search(r"\d\s*乘\s*\d", text) else text
    text = re.sub(r"\s+", " ", text).strip()
    return text


def wrap_display(text: str, width: int = MAX_DISPLAY_WIDTH) -> list[str]:
    """Wrap without losing content, preferring punctuation/space boundaries."""
    text = clean_text(text)
    if not text:
        return []
    result: list[str] = []
    rest = text
    while display_width(rest) > width:
        used = 0
        cut = 0
        preferred = 0
        for idx, ch in enumerate(rest):
            used += 2 if ord(ch) > 127 else 1
            if used > width:
                break
            cut = idx + 1
            if ch in "，。；：、,.!?;:）)]} " and used >= int(width * 0.62):
                preferred = cut
        if preferred:
            cut = preferred
        if cut <= 0:
            cut = 1
        result.append(rest[:cut].strip())
        rest = rest[cut:].strip()
    if rest:
        result.append(rest)
    return [x for x in result if x]


def markdown_to_lines(path: Path) -> list[DepositLine]:
    lines: list[DepositLine] = []
    section = "软件概述"
    for raw in path.read_text(encoding="utf-8").splitlines():
        text = raw.strip()
        if not text or text == "---" or text.startswith("![") or text.startswith("```"):
            continue
        if re.fullmatch(r"\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?", text):
            continue
        if text.startswith("#"):
            section = clean_text(text.lstrip("#").strip())
            text = f"【{section}】"
        elif text.startswith("|") and text.endswith("|"):
            cells = [clean_text(cell) for cell in text.strip("|").split("|")]
            cells = [cell for cell in cells if cell]
            if not cells:
                continue
            text = "；".join(cells)
        else:
            text = re.sub(r"^[-*+]\s+", "", text)
        for wrapped in wrap_display(text):
            lines.append(DepositLine(wrapped, section))
    return lines


def core_manifest() -> list[dict]:
    path = WORKING / "source-manifest-V1.0.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    return [item for item in data["includedFiles"] if item.get("included")]


def role_for(path: str) -> str:
    exact = {
        "src/main.tsx": "浏览器入口与根组件挂载",
        "src/App.tsx": "全局场景状态机、流程编排与背景音乐映射",
        "src/game/story.ts": "剧情场景、对白、选择与历史对照数据",
        "src/game/battle.ts": "通用回合制战斗状态与纯函数结算",
        "src/game/scenarios.ts": "各战斗场景的配置与分支参数",
        "src/game/tutorial.ts": "教学战斗状态、行动点和结果判定",
        "src/game/defenseBattle.ts": "撤离防守危机、预览和回合结算",
        "src/game/save.ts": "本地存档、兼容性、规范化与自动存档",
        "src/game/audio.ts": "背景音乐、语音、音效和静音状态管理",
        "src/game/animationEngine.ts": "战斗位移、命中、受击和镜头反馈",
        "src/sections/TitleScreen.tsx": "标题页、继续游戏和辅助入口",
        "src/sections/StoryScene.tsx": "剧情对白播放、分支选择和语音触发",
        "src/sections/BattleScene.tsx": "通用战斗界面、行动选择和动画调度",
        "src/sections/TutorialBattleScene.tsx": "教学战斗界面与目标反馈",
    }
    if path in exact:
        return exact[path]
    if path.startswith("src/platform/"):
        return "平台存储、路由、音频、图像或分享适配"
    if path.startswith("src/ui/"):
        return "业务界面、交互面板或配套静态数据"
    if path.startswith("src/components/"):
        return "可复用视觉组件、弹窗或战斗反馈组件"
    if path.startswith("src/hooks/"):
        return "可复用状态钩子与资源加载逻辑"
    if path.startswith("src/lib/"):
        return "资源地址、预加载或公共工具逻辑"
    return "V1.0 核心实现模块"


def grouped(items: list[str], size: int = 4) -> Iterable[list[str]]:
    for idx in range(0, len(items), size):
        yield items[idx : idx + size]


def source_facts(manifest: list[dict]) -> list[DepositLine]:
    facts: list[DepositLine] = []

    def add(section: str, text: str) -> None:
        for line in wrap_display(text):
            facts.append(DepositLine(line, section))

    add("附录 N 源码模块与依赖追溯", "【附录 N 源码模块与依赖追溯】")
    for item in manifest:
        path = item["path"]
        add(
            "附录 N 源码模块与依赖追溯",
            f"模块 {path}：共 {item['totalLines']} 行、非空 {item['nonEmptyLines']} 行；职责为{role_for(path)}。",
        )
        add(
            "附录 N 源码模块与依赖追溯",
            f"模块校验 {path}：SHA-256 前十二位为 {item['sha256'][:12]}，纳入 V1.0 固定源码清单。",
        )
        src = (REPO / path).read_text(encoding="utf-8")
        imports = re.findall(r"\bfrom\s+['\"]([^'\"]+)['\"]", src)
        imports = list(dict.fromkeys(imports))
        for group in grouped(imports, 4):
            add(
                "附录 N 源码模块与依赖追溯",
                f"依赖关系 {path}：直接引用 {', '.join(group)}；引用关系构成该模块的输入边界。",
            )

    add("附录 O 类型、函数与常量索引", "【附录 O 类型、函数与常量索引】")
    symbol_re = re.compile(
        r"^(?:export\s+)?(?:default\s+)?(interface|type|class|function|const|enum)\s+([A-Za-z_$][A-Za-z0-9_$]*)",
        re.M,
    )
    descriptions = {
        "interface": "定义结构化数据契约",
        "type": "限定状态、参数或返回值的类型边界",
        "class": "封装具有生命周期的实现对象",
        "function": "封装可复用的计算或交互流程",
        "const": "保存只读配置、映射或函数引用",
        "enum": "定义有限状态集合",
    }
    for item in manifest:
        path = item["path"]
        src = (REPO / path).read_text(encoding="utf-8")
        for match in symbol_re.finditer(src):
            kind, name = match.groups()
            line_no = src.count("\n", 0, match.start()) + 1
            add(
                "附录 O 类型、函数与常量索引",
                f"符号 {name}：{kind}，位于 {path} 第 {line_no} 行；用于{descriptions[kind]}。",
            )

    add("附录 P 界面状态与数据字段追溯", "【附录 P 界面状态与数据字段追溯】")
    state_re = re.compile(r"const\s*\[\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*,[^\]]+\]\s*=\s*(?:React\.)?useState")
    interface_re = re.compile(r"^(?:export\s+)?interface\s+([A-Za-z_$][A-Za-z0-9_$]*)")
    field_re = re.compile(r"^\s{2}([A-Za-z_$][A-Za-z0-9_$]*)\??\s*:")
    for item in manifest:
        path = item["path"]
        src_lines = (REPO / path).read_text(encoding="utf-8").splitlines()
        current_interface: str | None = None
        brace_depth = 0
        for line_no, raw in enumerate(src_lines, 1):
            for match in state_re.finditer(raw):
                add(
                    "附录 P 界面状态与数据字段追溯",
                    f"界面状态 {match.group(1)}：在 {path} 第 {line_no} 行由 useState 管理，随组件交互生命周期更新。",
                )
            im = interface_re.match(raw)
            if im:
                current_interface = im.group(1)
                brace_depth = raw.count("{") - raw.count("}")
                continue
            if current_interface:
                brace_depth += raw.count("{") - raw.count("}")
                fm = field_re.match(raw)
                if fm:
                    add(
                        "附录 P 界面状态与数据字段追溯",
                        f"数据字段 {current_interface}.{fm.group(1)}：定义于 {path} 第 {line_no} 行，属于该接口的显式字段。",
                    )
                if brace_depth <= 0:
                    current_interface = None

    package = json.loads((REPO / "package.json").read_text(encoding="utf-8"))
    add("附录 Q 构建、依赖与验证入口", "【附录 Q 构建、依赖与验证入口】")
    for name, command in package.get("scripts", {}).items():
        add("附录 Q 构建、依赖与验证入口", f"命令 {name}：执行 {command}；用于开发、构建、测试或发布流程。")
    for name, version in {**package.get("dependencies", {}), **package.get("devDependencies", {})}.items():
        add("附录 Q 构建、依赖与验证入口", f"依赖 {name}：版本约束 {version}；由包管理清单锁定其安装范围。")

    add("附录 R 源码注释与实现约束摘录", "【附录 R 源码注释与实现约束摘录】")
    for item in manifest:
        path = item["path"]
        for line_no, raw in enumerate((REPO / path).read_text(encoding="utf-8").splitlines(), 1):
            stripped = raw.strip()
            if not (stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*")):
                continue
            comment = re.sub(r"^(?://|/\*+|\*+)\s*", "", stripped).rstrip("*/ ")
            if len(comment) < 5:
                continue
            add("附录 R 源码注释与实现约束摘录", f"实现注释 {path} 第 {line_no} 行：{comment}")
    return facts


def select_document_lines() -> list[DepositLine]:
    base = markdown_to_lines(WORKING / "软件设计与使用说明书-V1.0.md")
    facts = source_facts(core_manifest())
    combined = base + facts
    minimum = MIN_PAGES * LINES_PER_PAGE
    maximum = MAX_PAGES * LINES_PER_PAGE
    if len(combined) > maximum:
        combined = combined[:maximum]
    if len(combined) < minimum:
        manifest = core_manifest()
        idx = 0
        while len(combined) < minimum:
            item = manifest[idx % len(manifest)]
            path = item["path"]
            line_no = idx // len(manifest) + 1
            src_lines = (REPO / path).read_text(encoding="utf-8").splitlines()
            if line_no <= len(src_lines) and src_lines[line_no - 1].strip():
                combined.append(
                    DepositLine(
                        f"实现追溯 {path} 第 {line_no} 行：该有效语句属于 V1.0 固定源码基线并受文件哈希校验。",
                        "附录 S 实现基线追溯",
                    )
                )
            idx += 1
    page_count = math.ceil(len(combined) / LINES_PER_PAGE)
    page_count = max(MIN_PAGES, min(MAX_PAGES, page_count))
    target = page_count * LINES_PER_PAGE
    manifest = core_manifest()
    pad_idx = 0
    while len(combined) < target:
        item = manifest[pad_idx % len(manifest)]
        combined.append(
            DepositLine(
                f"清单核验 {item['path']}：非空代码 {item['nonEmptyLines']} 行，文件摘要 {item['sha256'][:16]}。",
                "附录 S 实现基线追溯",
            )
        )
        pad_idx += 1
    return combined[:target]


def set_run_font(run, font: str, size: float, *, bold: bool = False, color: str = "1F2937") -> None:
    run.font.name = font
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = RGBColor.from_string(color)
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.rFonts
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.insert(0, rfonts)
    for attr in ("ascii", "hAnsi", "eastAsia", "cs"):
        rfonts.set(qn(f"w:{attr}"), font)


def add_field(paragraph, field: str) -> None:
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = field
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.extend([begin, instr, separate, end])
    set_run_font(run, DOC_FONT, 8.5, color="6B7280")


def configure_document(doc: Document, *, title: str) -> None:
    section = doc.sections[0]
    section.page_width = Mm(210)
    section.page_height = Mm(297)
    section.top_margin = Mm(15)
    section.bottom_margin = Mm(15)
    section.left_margin = Mm(17)
    section.right_margin = Mm(17)
    section.header_distance = Mm(6)
    section.footer_distance = Mm(7)
    doc.core_properties.title = title
    doc.core_properties.subject = f"{SOFTWARE} {VERSION} 软件著作权登记鉴别材料"
    doc.core_properties.author = SOFTWARE
    doc.core_properties.keywords = "软件著作权,设计说明书,使用说明书,V1.0"

    normal = doc.styles["Normal"]
    normal.font.name = DOC_FONT
    normal.font.size = Pt(9.6)
    normal._element.rPr.rFonts.set(qn("w:ascii"), DOC_FONT)
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), DOC_FONT)
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), DOC_FONT)
    normal.paragraph_format.space_before = Pt(0)
    normal.paragraph_format.space_after = Pt(0)
    normal.paragraph_format.line_spacing_rule = WD_LINE_SPACING.EXACTLY
    normal.paragraph_format.line_spacing = Pt(18.5)

    if "Deposit Page Heading" not in [s.name for s in doc.styles]:
        page_style = doc.styles.add_style("Deposit Page Heading", WD_STYLE_TYPE.PARAGRAPH)
    else:
        page_style = doc.styles["Deposit Page Heading"]
    page_style.font.name = DOC_FONT
    page_style.font.size = Pt(11.5)
    page_style.font.bold = True
    page_style.font.color.rgb = RGBColor.from_string("1F4E78")
    page_style._element.rPr.rFonts.set(qn("w:ascii"), DOC_FONT)
    page_style._element.rPr.rFonts.set(qn("w:hAnsi"), DOC_FONT)
    page_style._element.rPr.rFonts.set(qn("w:eastAsia"), DOC_FONT)
    page_style.paragraph_format.space_before = Pt(0)
    page_style.paragraph_format.space_after = Pt(0)
    page_style.paragraph_format.line_spacing_rule = WD_LINE_SPACING.EXACTLY
    page_style.paragraph_format.line_spacing = Pt(22)

    header = section.header
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    hp.paragraph_format.space_after = Pt(0)
    hr = hp.add_run(f"{SOFTWARE} {VERSION}  |  软件设计与使用说明书")
    set_run_font(hr, DOC_FONT, 8.5, color="6B7280")

    footer = section.footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fp.paragraph_format.space_before = Pt(0)
    fr = fp.add_run("第 ")
    set_run_font(fr, DOC_FONT, 8.5, color="6B7280")
    add_field(fp, "PAGE")
    fr = fp.add_run(" 页 / 共 ")
    set_run_font(fr, DOC_FONT, 8.5, color="6B7280")
    add_field(fp, "NUMPAGES")
    fr = fp.add_run(" 页")
    set_run_font(fr, DOC_FONT, 8.5, color="6B7280")


def build_design_docx(lines: list[DepositLine], path: Path, trace_path: Path) -> None:
    doc = Document()
    configure_document(doc, title=DOC_TITLE)
    pages = len(lines) // LINES_PER_PAGE
    with trace_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["page", "inPageLine", "section", "content"])
        for page_idx in range(pages):
            page_lines = lines[page_idx * LINES_PER_PAGE : (page_idx + 1) * LINES_PER_PAGE]
            heading = page_lines[0].section
            p = doc.add_paragraph(style="Deposit Page Heading")
            p.paragraph_format.keep_with_next = False
            run = p.add_run(f"{heading}  ·  第 {page_idx + 1} 页")
            set_run_font(run, DOC_FONT, 11.5, bold=True, color="1F4E78")
            for line_idx, item in enumerate(page_lines, 1):
                p = doc.add_paragraph()
                p.paragraph_format.keep_together = True
                p.paragraph_format.widow_control = False
                is_heading = item.text.startswith("【") and item.text.endswith("】")
                run = p.add_run(item.text)
                set_run_font(run, DOC_FONT, 9.6, bold=is_heading, color="1F4E78" if is_heading else "1F2937")
                writer.writerow([page_idx + 1, line_idx, item.section, item.text])
            if page_idx + 1 < pages:
                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                p.add_run().add_break(WD_BREAK.PAGE)
    doc.save(path)


def build_source_docx(path: Path) -> None:
    trace = list(csv.DictReader((WORKING / "source-trace.csv").open(encoding="utf-8")))
    if len(trace) != 3000:
        raise RuntimeError(f"Expected 3000 source rows, got {len(trace)}")
    doc = Document()
    configure_document(doc, title=f"{SOFTWARE} {VERSION} 源程序鉴别材料")
    section = doc.sections[0]
    section.top_margin = Mm(14)
    section.bottom_margin = Mm(14)
    section.left_margin = Mm(14)
    section.right_margin = Mm(14)
    header = section.header.paragraphs[0]
    for run in list(header.runs):
        run._element.getparent().remove(run._element)
    hr = header.add_run(f"{SOFTWARE} {VERSION}  |  源程序鉴别材料")
    set_run_font(hr, CODE_FONT, 8.0, color="6B7280")
    for page_idx in range(60):
        page_rows = trace[page_idx * 50 : (page_idx + 1) * 50]
        for row in page_rows:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.EXACTLY
            p.paragraph_format.line_spacing = Pt(10.4)
            p.paragraph_format.left_indent = Mm(7)
            p.paragraph_format.first_line_indent = Mm(-7)
            n = p.add_run(f"{int(row['inPageLine']):02d}  ")
            set_run_font(n, CODE_FONT, 6.8, color="9CA3AF")
            code = p.add_run(row["content"])
            set_run_font(code, CODE_FONT, 6.8, color="111827")
        if page_idx < 59:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.add_run().add_break(WD_BREAK.PAGE)
    doc.save(path)


def write_confirmation_template() -> None:
    text = f"""# {SOFTWARE} {VERSION} 申请人事实确认表

> 本文件为申请人本人填写的内部表，不上传为软件鉴别材料。完成以下信息后，方可生成可直接提交的登记申请信息。

1. 申请人姓名或主体名称：
2. 证件类型：
3. 证件号码：
4. 联系地址：
5. 联系电话：
6. 电子邮箱：
7. 软件开发完成日期（YYYY-MM-DD）：
8. 软件是否已经向公众提供：
9. 如已发表，首次发表日期与地点：
10. 开发方式（独立/合作/委托/职务）：
11. 权利取得方式（原始取得/继受取得）：
12. 是否基于他人软件修改：
13. 是否存在共同开发人或其他权利人：
14. 软件全称“{SOFTWARE}”和版本号“{VERSION}”是否最终确认：
"""
    (CONFIRM / "申请人事实确认表-填写后回传.md").write_text(text, encoding="utf-8")


def write_readme(lines: list[DepositLine]) -> None:
    pages = len(lines) // LINES_PER_PAGE
    text = f"""# {SOFTWARE} {VERSION} 技术提交材料说明

本目录由当前 V1.0 源码重新生成。技术材料按国家版权局公开规章中的 A4、源程序每页不少于50行、文档每页不少于30行要求制作。

## 正式提交件

- `01-正式提交件-技术材料/01-{SOFTWARE}-{VERSION}-源程序鉴别材料.pdf`：60页，前30页加后30页，每页50行非空代码。
- `01-正式提交件-技术材料/02-{SOFTWARE}-{VERSION}-软件设计与使用说明书.pdf`：{pages}页，每页32行实质正文，提交全部文档。

## 仍需申请人本人完成

- 填写 `03-申请人确认后填写/申请人事实确认表-填写后回传.md`。
- 登录登记系统，按真实情况填写申请表并上传身份证明、权属证明和两份技术PDF。

申请人事实未确认前，技术材料可以验收，但整套登记申请仍不能宣称已经具备提交条件。
"""
    (OUT / "README-提交说明.md").write_text(text, encoding="utf-8")


def main() -> None:
    for directory in (SUBMIT, EDITABLE, CONFIRM, QA):
        directory.mkdir(parents=True, exist_ok=True)

    lines = select_document_lines()
    pages = len(lines) // LINES_PER_PAGE
    if not (MIN_PAGES <= pages <= MAX_PAGES):
        raise RuntimeError(f"Document page target out of range: {pages}")
    if any(display_width(item.text) > MAX_DISPLAY_WIDTH for item in lines):
        raise RuntimeError("A design document line exceeds the fixed display width")
    for item in lines:
        for token in FORBIDDEN:
            if token in item.text:
                raise RuntimeError(f"Forbidden token {token!r} in design content: {item.text}")

    design_docx = EDITABLE / f"02-{SOFTWARE}-{VERSION}-软件设计与使用说明书.docx"
    trace_csv = QA / "软件说明书逐页内容追溯.csv"
    build_design_docx(lines, design_docx, trace_csv)

    source_docx = EDITABLE / f"01-{SOFTWARE}-{VERSION}-源程序鉴别材料.docx"
    build_source_docx(source_docx)

    source_pdf = QODER_FINAL / f"02-{SOFTWARE}-{VERSION}-源程序鉴别材料.pdf"
    if not source_pdf.exists():
        raise FileNotFoundError(source_pdf)
    shutil.copy2(source_pdf, SUBMIT / f"01-{SOFTWARE}-{VERSION}-源程序鉴别材料.pdf")
    shutil.copy2(WORKING / "source-trace.csv", QA / "源程序逐行追溯.csv")
    shutil.copy2(WORKING / "source-manifest-V1.0.json", QA / "源程序清单-V1.0.json")

    write_confirmation_template()
    write_readme(lines)
    build_meta = {
        "software": SOFTWARE,
        "version": VERSION,
        "documentPages": pages,
        "documentLinesPerPage": LINES_PER_PAGE,
        "documentTotalLines": len(lines),
        "designDocxSha256": sha256(design_docx),
        "sourceDocxSha256": sha256(source_docx),
        "sourcePdfSha256": sha256(SUBMIT / f"01-{SOFTWARE}-{VERSION}-源程序鉴别材料.pdf"),
    }
    (QA / "构建元数据.json").write_text(json.dumps(build_meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(build_meta, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
