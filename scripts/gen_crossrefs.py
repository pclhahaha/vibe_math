"""Auto-generate cross-reference sections for all content files that lack them."""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)  # anchor to project root

with open('curriculum.json', 'r', encoding='utf-8') as f:
    lessons = json.load(f)

# Build lookup maps
lesson_by_id = {l['id']: l for l in lessons}
lesson_by_title = {}
for l in lessons:
    title_clean = l['title'].replace(' ', '').replace('—', '-').replace('–', '-')
    lesson_by_title[l['title']] = l
    lesson_by_title[title_clean] = l

# Category groups — courses in the same category are strongly related
cat_groups = {}
for l in lessons:
    cat = l['category']
    if cat not in cat_groups:
        cat_groups[cat] = []
    cat_groups[cat].append(l)

# Keyword-based topic relationships (manual rules for cross-category links)
RELATION_RULES = [
    # Format: (from_category_or_keyword, to_category_or_id, reason)
    ('线性代数', '行列式,特征向量,SVD,谱定理', '线性代数核心链'),
    ('微积分', '导数,梯度,黎曼积分', '微积分核心链'),
    ('量子力学', '谐振子,氢原子,不确定性原理,纠缠', '量子力学核心链'),
    ('统计力学', '熵,Ising模型,布朗运动,Boltzmann', '统计力学核心链'),
    ('相对论', '光锥,Lorentz变换,引力透镜', '相对论核心链'),
    ('量子场论', '费曼图,Higgs机制,标准模型', '量子场论核心链'),
    ('微分几何', '测地线,曲率,平行移动,纤维丛', '微分几何核心链'),
    ('拓扑学', '基本群,同调论,纽结不变量', '拓扑学核心链'),
    ('复分析', '复平面,围道积分', '复分析核心链'),
    ('群论', '群作用,李代数,伽罗瓦理论', '群论核心链'),
    ('数论', '素数筛,黎曼ζ,模形式,哥德巴赫,孪生素数', '数论核心链'),
    ('范畴论', '伴随函子,高阶范畴论', '范畴论核心链'),
    ('代数', '抽象代数,交换代数,伽罗瓦理论,泛代数', '代数核心链'),
    ('分析', '实分析,测度论,泛函分析,变分法', '分析核心链'),
    ('动力系统', '分形,Lorenz吸引子,孤子', '动力系统核心链'),
    ('几何', '凸几何,辛几何,灵魂猜想', '几何核心链'),
    ('代数几何', '代数几何,交换代数', '代数几何核心链'),
    ('逻辑与计算', 'Gödel,Turing机,Y组合子,证明论', '逻辑与计算核心链'),
    ('量子信息', '量子门,Bloch球,量子纠缠', '量子信息核心链'),
    ('热力学', 'Carnot循环,熵', '热力学核心链'),
    ('流体力学', 'Navier-Stokes,Lorenz吸引子', '流体力学核心链'),
    ('凝聚态', '能带结构,Ising模型', '凝聚态核心链'),
    ('粒子物理', '标准模型,Higgs机制', '粒子物理核心链'),
    ('宇宙学', 'CMB,引力透镜', '宇宙学核心链'),
]

# Build a relationship graph
def find_related(lesson, all_lessons, max_links=5):
    """Find up to max_links related lessons for a given lesson."""
    related = []
    added_ids = {lesson['id']}

    # 1. Same category first
    same_cat = [l for l in all_lessons if l['category'] == lesson['category'] and l['id'] != lesson['id']]
    # Sort by tier: same tier preferred
    tier = lesson.get('tier', '★★')
    same_cat.sort(key=lambda l: (0 if l.get('tier') == tier else 1))
    for l in same_cat:
        if l['id'] not in added_ids and len(related) < max_links:
            related.append((l, f"同一学科分类「{lesson['category']}」"))
            added_ids.add(l['id'])

    # 2. Cross-category from relation rules
    for rule_cat, targets, reason in RELATION_RULES:
        if rule_cat in lesson['category'] or rule_cat in lesson['title']:
            for target_name in targets.split(','):
                target_name = target_name.strip()
                t = lesson_by_title.get(target_name)
                if t and t['id'] not in added_ids and len(related) < max_links:
                    related.append((t, reason))
                    added_ids.add(t['id'])

    # 3. Keyword overlap in description
    desc_words = set(re.findall(r'[\u4e00-\u9fff\w]+', lesson['desc']))
    for l in all_lessons:
        if l['id'] in added_ids or len(related) >= max_links:
            continue
        other_words = set(re.findall(r'[\u4e00-\u9fff\w]+', l['desc']))
        common = desc_words & other_words
        if len(common) >= 3:
            related.append((l, '内容关键词相关'))
            added_ids.add(l['id'])

    # 4. Same tier across categories
    if len(related) < 3:
        same_tier = [l for l in all_lessons if l.get('tier') == tier and l['id'] != lesson['id'] and l['category'] != lesson['category']]
        for l in same_tier:
            if l['id'] not in added_ids and len(related) < max_links:
                related.append((l, '同一难度层次'))
                added_ids.add(l['id'])

    return related[:max_links]


# Process each content file
CROSS_REF_MARKER = '关联课程'
content_dir = 'content'
stats = {'added': 0, 'skipped': 0, 'missing_content': 0}

for lesson in lessons:
    sid = lesson['id']
    content_file = os.path.join(content_dir, f'{sid}.html')

    if not os.path.exists(content_file):
        stats['missing_content'] += 1
        continue

    with open(content_file, 'r', encoding='utf-8') as f:
        body = f.read()

    if CROSS_REF_MARKER in body:
        stats['skipped'] += 1
        continue

    # Find related courses
    related = find_related(lesson, lessons, max_links=4)
    if not related:
        stats['skipped'] += 1
        continue

    # Build cross-reference HTML
    links_html = ''
    for r_lesson, reason in related:
        links_html += (
            f'<p>&rarr; <a href="/pages/{r_lesson["id"]}.html">'
            f'{r_lesson["emoji"]} {r_lesson["title"]}</a>'
            f'：{reason}。</p>\n'
        )

    cross_section = (
        f'<section><h3>关联课程</h3>\n'
        f'{links_html}'
        f'</section>\n'
    )

    # Append to content
    body = body.rstrip() + '\n' + cross_section

    with open(content_file, 'w', encoding='utf-8') as f:
        f.write(body)

    stats['added'] += 1
    print(f'  + {sid} ← {[r[0]["id"] for r in related]}')

print(f'\nDone: {stats["added"]} added, {stats["skipped"]} already had, {stats["missing_content"]} no content file')
