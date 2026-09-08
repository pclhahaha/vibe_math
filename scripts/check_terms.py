#!/usr/bin/env python3
"""Terminology consistency report (informational; no auto-edit).

Pairs: canonical preferred form vs variants to avoid. Writes docs/term-report.md.
"""
import sys, glob, os, re, collections
sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

RULES = [
    ('ζ 函数（带空格）', ['ζ函数', 'ζ-函数', 'zeta 函数']),
    ('Gödel（人名拉丁拼）', ['哥德尔', 'Godel']),
    ('Wiles', ['怀尔斯']),
    ('Perelman', ['佩雷尔曼']),
    ('Grothendieck', ['格罗滕迪克']),
    ('Hausdorff 维数', ['豪斯多夫维数']),
    ('力迫（forcing）', ['力迫法(仅此写法可并行)']),
    ('欧拉示性数 χ', ['欧拉数 χ', 'Euler 数']),
    ('亏格 g', ['孔数', '亏数']),
    ('子空间', ['子空间(子空间可并行)']),
    ('样本协方差', ['协方差阵(仅泛称可并行)']),
]
report = []
for canon, bads in RULES:
    hits = []
    for f in glob.glob('content/*.html'):
        c = open(f, encoding='utf-8').read()
        for b in bads:
            cnt = c.count(b)
            if cnt:
                hits.append((os.path.basename(f), b, cnt))
    report.append((canon, bads, hits))

with open('docs/term-report.md', 'w', encoding='utf-8') as out:
    out.write('# 术语一致性报告（自动生成 · 信息性，不改动文件）\n\n')
    total = 0
    for canon, bads, hits in report:
        total += len(hits)
        out.write(f'## {canon}\n\n')
        if not hits:
            out.write('（无变体命中）\n\n')
            continue
        for name, bad, cnt in hits:
            out.write(f'- `{name}`: `{bad}` × {cnt}\n')
        out.write('\n')
    out.write(f'\n共 {total} 处待人工复核。\n')
    out.write('> 生成命令：`python scripts/check_terms.py`\n')

print('术语报告写入 docs/term-report.md（待复核处：%d）' % sum(len(h) for _, _, h in report))
