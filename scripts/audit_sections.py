#!/usr/bin/env python3
"""Content audit: how complete each lesson is against the canonical skeleton.

Canonical skeleton markers (kakeya standard): 〇、一…九、关键论文、工作题、
试试看、教科书与进一步阅读、前置知识、关联课程。
Writes docs/content-audit.md (grouped report). Exit 0 always (informational).
"""
import sys, glob, os, re, collections
sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

SECT = ['〇', '一、', '二、', '三、', '四、', '五、', '六、', '七、', '八、', '九、',
        '关键论文', '工作题', '试试看', '教科书与进一步阅读', '前置知识', '关联课程']
HARD = ['〇', '一、', '关键论文', '工作题', '教科书与进一步阅读', '前置知识', '关联课程']

rows = []
for f in sorted(glob.glob('content/*.html')):
    c = open(f, encoding='utf-8').read()
    miss = [s for s in SECT if s not in c]
    n = len(SECT) - len(miss)
    hard_miss = [s for s in HARD if s not in c]
    size = len(c)
    rows.append((os.path.basename(f)[:-5], n, miss, hard_miss, size))

buckets = {'完整(16)': 0, '微缺(13-15)': 0, '中缺(8-12)': 0, '骨架缺失(<8)': 0}
for name, n, miss, hm, size in rows:
    if n == 16: buckets['完整(16)'] += 1
    elif n >= 13: buckets['微缺(13-15)'] += 1
    elif n >= 8: buckets['中缺(8-12)'] += 1
    else: buckets['骨架缺失(<8)'] += 1

with open('docs/content-audit.md', 'w', encoding='utf-8') as out:
    out.write('# Vibe Math 内容体检报告（自动生成 · 勿手改）\n\n')
    out.write('生成时间：' + __import__('datetime').datetime.now().isoformat(timespec='minutes') + '\n\n')
    out.write('## 概览\n\n| 档位 | 课程数 |\n|---|--:|\n')
    for k, v in buckets.items():
        out.write(f'| {k} | {v} |\n')
    out.write(f'\n总课程：{len(rows)}\n\n')
    out.write('## 逐课缺口\n\n| 课程 | 骨架节数/16 | 硬缺口(前置/关联/关键论文/教材/工作题/〇/一) |\n|---|---|---|\n')
    for name, n, miss, hm, size in sorted(rows, key=lambda r: r[1]):
        out.write(f'| {name} | {n}/16 | {("、".join(hm) if hm else "—")} |\n')
    out.write('\n> 说明：\n> - “硬缺口”=建议优先补齐；结构类（〇 或 一、… 编号标题）可在正文已含同义标题时忽略。\n')
    out.write('> - 生成命令：`python scripts/audit_sections.py`\n')

print('内容档位分布:', dict(buckets))
print('报告写入 docs/content-audit.md')
