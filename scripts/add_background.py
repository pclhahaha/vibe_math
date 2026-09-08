"""Add a 背景需求 banner after the intuition intro of core/frontier courses."""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

with open('curriculum.json', 'r', encoding='utf-8') as f:
    lessons = json.load(f)
tmap = {l['id']: l for l in lessons}

# Reuse the prerequisite map from add_prereqs.py
import importlib.util
spec = importlib.util.spec_from_file_location('ap', 'scripts/add_prereqs.py')
# We only need the PREREQS dict and resolve logic; read it without executing main
import ast
src = open('scripts/add_prereqs.py', encoding='utf-8').read()
tree = ast.parse(src)
PREREQS = None
ALIASES = {}
for node in ast.walk(tree):
    if isinstance(node, ast.Assign):
        for t in node.targets:
            if isinstance(t, ast.Name) and t.id == 'PREREQS':
                PREREQS = ast.literal_eval(node.value)
            if isinstance(t, ast.Name) and t.id == 'ALIASES':
                ALIASES = ast.literal_eval(node.value)

def resolve(plist):
    out = []
    for p in plist:
        real = ALIASES.get(p, p)
        if real in tmap and real not in out:
            out.append(real)
    return out

TIER_LABEL = {'★': '基础', '★★': '核心', '★★★': '前沿'}

added = 0
for l in lessons:
    tier = l.get('tier', '★★')
    if tier == '★':
        continue  # basic courses are fully readable, no banner needed
    sid = l['id']
    p = f'content/{sid}.html'
    if not os.path.exists(p):
        continue
    c = open(p, encoding='utf-8').read()
    if '背景需求' in c or '本节需要背景' in c or '需要背景' in c:
        continue
    prereqs = resolve(PREREQS.get(sid, []))
    if prereqs:
        links = '、'.join(f'<a href="/pages/{pid}.html">{tmap[pid]["title"]}</a>' for pid in prereqs)
        req_line = f'<p><strong>建议先掌握</strong>：{links}。</p>'
    else:
        req_line = '<p><strong>建议先掌握</strong>：相应的 ★ 基础课程。</p>'
    banner = (
        '<div class="key-insight" style="border-left-color:#f78166">'
        f'<strong>⚠️ 背景提示</strong>：本课属于 <strong>{TIER_LABEL[tier]}</strong> 级别，正文较深。{req_line}'
        '<p>高级章节（证明、前沿、工作题）需要相应背景，未掌握可先看「〇、直觉入门」了解核心思想，或回到前置课程补基础。</p>'
        '</div>\n'
    )
    # insert after the first 直觉入门 section closes
    m = re.search(r'(<section>\s*<h3>〇[^<]*</h3>.*?</section>)', c, re.DOTALL)
    if m:
        c = c[:m.end()] + '\n' + banner + c[m.end():]
        open(p, 'w', encoding='utf-8').write(c)
        added += 1
    else:
        # fallback: insert right after the first <section>...</section>
        m2 = re.search(r'(<section>.*?</section>)', c, re.DOTALL)
        if m2:
            c = c[:m2.end()] + '\n' + banner + c[m2.end():]
            open(p, 'w', encoding='utf-8').write(c)
            added += 1

print(f'Background banners added to {added} core/frontier courses')
