"""Add 前置知识 (prerequisites) to courses and graph.json.

Curated prerequisite map: course_id -> [prerequisite course ids].
Used to (1) inject a 前置知识 section into each content file, and
(2) enrich graph.json so the knowledge graph can show prerequisite edges.
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

with open('curriculum.json', 'r', encoding='utf-8') as f:
    lessons = json.load(f)

ids = {l['id'] for l in lessons}

# Curated prerequisites (only list ids that exist)
PREREQS = {
    # === 数学基础 ===
    'epsilon-delta': ['set-theory'],
    'real-analysis': ['epsilon-delta', 'set-theory'],
    'measure-theory': ['real-analysis'],
    'probability': ['measure-theory'],
    'functional-analysis': ['measure-theory', 'real-analysis'],
    'operator-algebras': ['functional-analysis', 'measure-theory'],

    # === 微积分 ===
    'derivative': ['epsilon-delta'],
    'riemann-integral': ['derivative', 'epsilon-delta'],
    'gradient': ['derivative'],
    'variational-calculus': ['derivative', 'riemann-integral'],
    'optimal-transport': ['measure-theory', 'probability'],

    # === 线性代数 ===
    'linear-transform': ['set-theory'],
    'eigenvectors': ['linear-transform'],
    'determinant': ['linear-transform'],
    'svd': ['linear-transform', 'eigenvectors'],
    'spectral-theorem': ['eigenvectors', 'linear-transform'],
    'numerical-methods': ['linear-transform', 'svd', 'gradient'],

    # === 复分析 ===
    'complex-plane': ['real-analysis'],
    'contour-integral': ['complex-plane'],
    'riemann-surface': ['complex-plane', 'contour-integral', 'algebraic-topology-homology'],
    'several-complex-variables': ['complex-plane'],

    # === 代数 ===
    'abstract-algebra': ['set-theory'],
    'group-action': ['abstract-algebra'],
    'galois-theory': ['group-action', 'abstract-algebra'],
    'commutative-algebra': ['abstract-algebra'],
    'algebraic-geometry': ['commutative-algebra', 'abstract-algebra', 'homology'],
    'algebraic-K-theory': ['abstract-algebra', 'algebraic-topology-homology'],
    'universal-algebra': ['abstract-algebra'],
    'lie-algebra': ['group-action', 'linear-transform'],
    'geometric-group-theory': ['group-action'],
    'category-theory-adjoint': ['abstract-algebra', 'set-theory'],
    'higher-category-theory': ['category-theory-adjoint'],

    # === 拓扑 ===
    'fundamental-group': ['set-theory', 'real-analysis'],
    'algebraic-topology-homology': ['fundamental-group'],
    'homology': ['algebraic-topology-homology'],
    'knot-invariant': ['fundamental-group'],
    'differential-topology-morse': ['fundamental-group', 'real-analysis'],
    'poincare-conjecture': ['differential-topology-morse', 'fiber-bundle'],

    # === 几何 ===
    'geodesic': ['linear-transform', 'derivative'],
    'curvature': ['geodesic'],
    'parallel-transport': ['geodesic', 'curvature'],
    'fiber-bundle': ['parallel-transport', 'lie-algebra'],
    'convex-geometry': ['linear-transform'],
    'symplectic-geometry': ['parallel-transport', 'variational-calculus', 'geodesic'],
    'soul-conjecture': ['curvature', 'geodesic'],
    'noncommutative-geometry': ['functional-analysis', 'operator-algebras', 'category-theory-adjoint'],

    # === 数论 ===
    'sieve': ['set-theory'],
    'zeta': ['real-analysis', 'complex-plane'],
    'modular-forms': ['complex-plane', 'lie-algebra'],
    'goldbach': ['sieve', 'zeta'],
    'twin-prime': ['sieve', 'zeta'],

    # === 逻辑 ===
    'godel': ['set-theory', 'turing-machine'],
    'turing-machine': ['set-theory'],
    'y combinator': ['turing-machine'],
    'proof-theory': ['godel', 'turing-machine'],
    'hilbert-problems': ['set-theory', 'real-analysis'],
    'millennium-problems': ['set-theory', 'zeta', 'functional-analysis'],

    # === 经典物理 ===
    'classical-mechanics': ['derivative', 'variational-calculus'],
    'electromagnetism': ['classical-mechanics', 'vector-calculus'],
    'thermodynamics': ['classical-mechanics', 'probability'],
    'optics': ['electromagnetism'],
    'light-cone': ['electromagnetism', 'classical-mechanics'],
    'lorentz-transform': ['light-cone'],
    'gravitational-lens': ['light-cone', 'geodesic'],

    # === 统计 ===
    'entropy': ['probability', 'thermodynamics'],
    'ising-model': ['entropy', 'probability'],
    'boltzmann': ['entropy', 'probability', 'classical-mechanics'],
    'brownian-motion': ['probability', 'measure-theory'],
    'kalman-filter': ['probability', 'linear-transform'],

    # === 量子 ===
    'bloch-sphere': ['linear-transform', 'complex-plane'],
    'uncertainty': ['bloch-sphere', 'functional-analysis'],
    'harmonic-oscillator': ['bloch-sphere', 'derivative'],
    'hydrogen-atom': ['harmonic-oscillator', 'complex-plane'],
    'entanglement': ['bloch-sphere', 'uncertainty'],
    'qubit-gates': ['bloch-sphere', 'linear-transform'],

    # === 场论 ===
    'feynman-diagram': ['entanglement', 'electromagnetism', 'contour-integral'],
    'higgs-mechanism': ['feynman-diagram', 'lie-algebra'],
    'standard-model': ['higgs-mechanism', 'feynman-diagram'],
    'nuclear-physics': ['standard-model'],
    'band-structure': ['quantum-basics', 'hydrogen-atom'],
    'cmb': ['light-cone', 'gravitational-lens'],

    # === 动力系统 ===
    'fractal': ['complex-plane'],
    'lorenz-attractor': ['classical-mechanics'],
    'soliton': ['classical-mechanics', 'derivative'],
    'navier-stokes': ['classical-mechanics', 'derivative'],
    'carnot-cycle': ['thermodynamics'],

    # === 概率/组合 ===
    'combinatorics': ['set-theory'],
    'kakeya': ['measure-theory', 'harmonic-analysis'],

    # === 2025 新增（依据普林斯顿数学指南补全的分支） ===
    'graph-theory': ['set-theory', 'combinatorics'],
    'pde': ['gradient', 'fourier-series'],
    'representation-theory': ['group-action', 'linear-transform', 'eigenvectors'],
    'p-vs-np': ['turing-machine', 'godel'],
    'elliptic-curves': ['modular-forms', 'galois-theory', 'representation-theory'],
    'differential-forms': ['gradient', 'riemann-integral', 'contour-integral'],
    'fourier-transform': ['fourier-series', 'riemann-integral', 'complex-plane'],
    'clt': ['probability', 'measure-theory'],
    'hyperbolic-geometry': ['geodesic', 'complex-plane'],

    # === 2025 P2（第二轮：PC Part III–V 更广覆盖） ===
    'ergodic-theory': ['measure-theory', 'fourier-series', 'lorenz-attractor'],
    'model-theory': ['set-theory', 'godel', 'proof-theory'],
    'high-dim-geometry': ['probability', 'clt', 'linear-transform'],
    'cryptography': ['sieve', 'abstract-algebra'],
    'additive-combinatorics': ['combinatorics', 'sieve', 'graph-theory'],
    'laplace-eigenvalue': ['pde', 'fourier-series', 'spectral-theorem'],

    # === 2025 P3（第三轮：PC 更广覆盖，含跨分支与千禧年） ===
    'complex-dynamics': ['complex-plane', 'fractal'],
    'percolation': ['probability', 'graph-theory'],
    'diophantine-approximation': ['real-analysis', 'sieve'],
    'bifurcation': ['lorenz-attractor', 'real-analysis'],
    'convex-optimization': ['gradient', 'linear-transform', 'optimal-transport'],
    'yang-mills-mass-gap': ['fiber-bundle', 'differential-forms', 'feynman-diagram'],

    # === 2025 P4（第四轮） ===
    'algebraic-number-theory': ['galois-theory', 'commutative-algebra', 'zeta'],
    'lattice-crypto': ['cryptography', 'high-dim-geometry', 'algebraic-number-theory'],
    'random-matrix': ['eigenvectors', 'clt', 'high-dim-geometry'],
    'martingales': ['probability', 'clt', 'brownian-motion'],
    'surface-topology': ['fundamental-group', 'algebraic-topology-homology', 'hyperbolic-geometry'],
    'lie-group-representations': ['representation-theory', 'fourier-series', 'lie-algebra'],

    # === 2025 P5（第五轮：PC 收官缺口） ===
    'forcing-ch': ['set-theory', 'godel', 'model-theory'],
    'p-adic-numbers': ['algebraic-number-theory', 'galois-theory', 'real-analysis'],
    'spectral-sequences': ['algebraic-topology-homology', 'homology', 'fiber-bundle'],
    'schemes': ['commutative-algebra', 'algebraic-geometry', 'algebraic-number-theory'],
    'geometric-measure-theory': ['measure-theory', 'fractal', 'kakeya'],
}

# Map legacy alias ids to real course ids
ALIASES = {
    'vector-calculus': 'gradient',
    'quantum-basics': 'bloch-sphere',
    'harmonic-analysis': 'fourier-series',
}

def resolve(prereq_list):
    out = []
    for p in prereq_list:
        real = ALIASES.get(p, p)
        if real in ids and real not in out:
            out.append(real)
    return out

def title_map():
    return {l['id']: l for l in lessons}

tmap = title_map()

# 1) Inject 前置知识 section into content files
added = 0
for l in lessons:
    sid = l['id']
    p = f'content/{sid}.html'
    if not os.path.exists(p):
        continue
    c = open(p, encoding='utf-8').read()
    if '前置知识' in c:
        continue
    prereqs = resolve(PREREQS.get(sid, []))
    if not prereqs:
        continue
    links = '、'.join(
        f'<a href="/pages/{pid}.html">{tmap[pid]["title"]}</a>' for pid in prereqs
    )
    section = (
        '<section><h3>前置知识</h3>\n'
        f'<p>学习本课前，建议先掌握：{links}。</p>\n'
        '</section>\n'
    )
    m = re.search(r'<section>\s*<h3>[^<]*关联课程</h3>', c)
    if m:
        c = c[:m.start()] + section + c[m.start():]
        open(p, 'w', encoding='utf-8').write(c)
        added += 1

print(f'Prerequisites added to {added} content files')

# Fix any stale relative prereq links (pages/xxx.html -> /pages/xxx.html)
fixed = 0
for l in lessons:
    sid = l['id']
    p = f'content/{sid}.html'
    if not os.path.exists(p):
        continue
    c = open(p, encoding='utf-8').read()
    if 'href="pages/' in c:
        c = c.replace('href="pages/', 'href="/pages/')
        open(p, 'w', encoding='utf-8').write(c)
        fixed += 1
print(f'Fixed stale prereq links in {fixed} files')

# 2) Enrich graph.json with prereq edges
with open('public/graph.json', 'r', encoding='utf-8') as f:
    graph = json.load(f)

prereq_edges = []
for sid, plist in PREREQS.items():
    for p in resolve(plist):
        if p != sid:
            prereq_edges.append({'source': p, 'target': sid})

graph['prereq_edges'] = prereq_edges
with open('public/graph.json', 'w', encoding='utf-8') as f:
    json.dump(graph, f, ensure_ascii=False)

print(f'Prereq edges in graph: {len(prereq_edges)}')
