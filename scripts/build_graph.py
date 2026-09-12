"""Build graph.json from course cross-references for the knowledge graph page."""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)  # anchor to project root

with open('curriculum.json', 'r', encoding='utf-8') as f:
    lessons = json.load(f)

nodes = []
id_set = set()
for l in lessons:
    id_set.add(l['id'])
    nodes.append({
        'id': l['id'],
        'title': l['title'],
        'emoji': l['emoji'],
        'category': l['category'],
        'tier': l.get('tier', '★★'),
    })

# Extract cross-references from content files
edges = []
edge_set = set()
for l in lessons:
    sid = l['id']
    p = f'content/{sid}.html'
    if not os.path.exists(p):
        continue
    c = open(p, encoding='utf-8').read()
    # Find all links to /pages/xxx.html
    links = re.findall(r'href="\/pages\/([^".]+)\.html"', c)
    for target in links:
        if target in id_set and target != sid:
            key = tuple(sorted([sid, target]))
            if key not in edge_set:
                edge_set.add(key)
                edges.append({'source': sid, 'target': target})

# Category colors
categories = {}
for l in lessons:
    categories.setdefault(l['category'], set())
    categories[l['category']].add(l['id'])

graph = {
    'nodes': nodes,
    'edges': edges,
    'categories': sorted(categories.keys()),
    'stats': {'nodes': len(nodes), 'edges': len(edges)},
}

# Preserve prerequisite edges written by add_prereqs.py (runs earlier in `npm run gen`).
# Without this, this script overwrites graph.json and the knowledge graph loses its
# prerequisite tree (all nodes collapse to depth 0).
_prev_path = 'public/graph.json'
if os.path.exists(_prev_path):
    try:
        with open(_prev_path, 'r', encoding='utf-8') as f:
            _prev = json.load(f)
        if _prev.get('prereq_edges'):
            graph['prereq_edges'] = _prev['prereq_edges']
    except (ValueError, OSError):
        pass

with open('public/graph.json', 'w', encoding='utf-8') as f:
    json.dump(graph, f, ensure_ascii=False)

print(f'Graph: {len(nodes)} nodes, {len(edges)} edges')
