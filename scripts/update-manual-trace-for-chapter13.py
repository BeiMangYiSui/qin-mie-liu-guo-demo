#!/usr/bin/env python3
"""Insert the Chapter 13 trace page and shift appendix page numbers."""

from __future__ import annotations

import csv
from pathlib import Path


TRACE = Path("/Users/zhuangxiji/Desktop/秦灭六国软著申请/Codex-最终材料-20260812/04-QA与校验/软件说明书逐页内容追溯.csv")

LINES = (
    "【第 13 章 技术特点】",
    "【13.1 总体技术路线】",
    "本软件采用 TypeScript、React 与 Vite 构建浏览器单页应用。",
    "剧情、分支、战斗、特殊玩法、存档和史乘展示运行于统一框架。",
    "TypeScript 约束场景、战斗、剧情标记和存档的数据结构。",
    "React 负责界面呈现，Vite 负责开发调试与生产构建。",
    "【13.2 部署方式】",
    "浏览器版本构建后生成纯静态文件。",
    "发布文件可部署到静态服务器、对象存储或内容分发网络。",
    "单机剧情流程无须部署独立业务服务器。",
    "项目预留微信、抖音小游戏的平台适配层和独立构建入口。",
    "小游戏原生接口迁移完成后可复用核心剧情、战斗和存档规则。",
    "【13.3 数据驱动与场景状态机】",
    "剧情内容、场景跳转、分支结果和战斗参数采用结构化数据描述。",
    "主程序通过场景状态机决定当前界面和下一流程。",
    "扩展场景时以增加数据配置和状态映射为主。",
    "【13.4 业务逻辑与界面解耦】",
    "战斗、教学、撤离、存档兼容和剧情标记由独立业务模块处理。",
    "界面层负责展示状态与转发操作，业务层负责计算结果。",
    "该结构比将数值、动画和事件集中在页面脚本中更易测试和复用。",
    "【13.5 跨平台适配设计】",
    "平台适配器统一封装存储、音频、图像、路由和分享能力。",
    "浏览器与小游戏发布形态可替换具体平台接口而共用核心规则。",
    "【13.6 本地存档与兼容控制】",
    "软件提供三个手动槽位、战前自动存档、战败回卷和版本兼容校验。",
    "未来版存档禁止覆盖，以降低版本变化导致的进度损坏风险。",
    "【13.7 资源加载与运行保障】",
    "主要媒体提前预取，单个资源失败时降级处理，不阻断剧情推进。",
    "软件兼顾移动端音频解锁、响应式布局和减少动态效果偏好。",
    "总体架构以轻量部署、数据驱动、业务解耦和多端适配为主要特点。",
)


def main() -> None:
    with TRACE.open(encoding="utf-8", newline="") as stream:
        rows = list(csv.DictReader(stream))
        fields = list(rows[0])
    if any(int(row["page"]) == 24 and row["section"].startswith("第 13 章") for row in rows):
        return
    for row in rows:
        if int(row["page"]) >= 24:
            row["page"] = str(int(row["page"]) + 1)
    chapter_rows = [
        {
            "page": "24",
            "inPageLine": str(index),
            "section": "第 13 章 技术特点",
            "content": content,
            "pageType": "text",
            "imageFile": "",
        }
        for index, content in enumerate(LINES, 1)
    ]
    rows.extend(chapter_rows)
    rows.sort(key=lambda row: (int(row["page"]), int(row["inPageLine"])))
    with TRACE.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    main()
