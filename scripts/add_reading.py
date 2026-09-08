"""Add '进一步阅读' (textbook references) section to courses before 关联课程."""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)  # anchor to project root

TEXTBOOKS = {
    '线性代数': ['S. Axler, Linear Algebra Done Right (4th ed.)', 'K. Hoffman & R. Kunze, Linear Algebra'],
    '微积分': ['M. Spivak, Calculus', 'W. Rudin, Principles of Mathematical Analysis'],
    '复分析': ['L. Ahlfors, Complex Analysis', 'J. Conway, Functions of One Complex Variable'],
    '微分几何': ['M. do Carmo, Differential Geometry of Curves and Surfaces', 'J. Lee, Introduction to Smooth Manifolds'],
    '量子力学': ['J. Sakurai, Modern Quantum Mechanics', 'D. Griffiths, Introduction to Quantum Mechanics'],
    '统计力学': ['M. Kardar, Statistical Physics of Particles', 'K. Huang, Statistical Mechanics'],
    '相对论': ['S. Carroll, Spacetime and Geometry', 'R. Wald, General Relativity'],
    '群论': ['M. Artin, Algebra', 'J.-P. Serre, Linear Representations of Finite Groups'],
    '数论': ['G. Hardy & E. Wright, An Introduction to the Theory of Numbers', 'K. Ireland & M. Rosen, A Classical Introduction to Modern Number Theory'],
    '代数': ['S. Lang, Algebra', 'M. Artin, Algebra'],
    '拓扑学': ['A. Hatcher, Algebraic Topology', 'J. Munkres, Topology'],
    '分析': ['W. Rudin, Real and Complex Analysis', 'G. Folland, Real Analysis'],
    '概率论': ['R. Durrett, Probability: Theory and Examples', 'W. Feller, An Introduction to Probability Theory'],
    '代数几何': ['R. Hartshorne, Algebraic Geometry', 'D. Eisenbud & J. Harris, The Geometry of Schemes'],
    '范畴论': ['S. Mac Lane, Categories for the Working Mathematician', 'E. Riehl, Category Theory in Context'],
    '几何': ['M. do Carmo, Riemannian Geometry', 'M. Berger, A Panoramic View of Riemannian Geometry'],
    '量子场论': ['M. Peskin & D. Schroeder, An Introduction to QFT', 'S. Weinberg, The Quantum Theory of Fields'],
    '流体力学': ['G. Batchelor, An Introduction to Fluid Dynamics', 'A. Chorin & J. Marsden, A Mathematical Introduction to Fluid Mechanics'],
    '宇宙学': ['S. Dodelson, Modern Cosmology', 'S. Weinberg, Cosmology'],
    '凝聚态': ['N. Ashcroft & N. Mermin, Solid State Physics', 'C. Kittel, Introduction to Solid State Physics'],
    '经典力学': ['H. Goldstein, Classical Mechanics', 'V. Arnold, Mathematical Methods of Classical Mechanics'],
    '电磁学': ['J. Jackson, Classical Electrodynamics', 'D. Griffiths, Introduction to Electrodynamics'],
    '数值方法': ['G. Golub & C. Van Loan, Matrix Computations', 'W. Press et al., Numerical Recipes'],
    '热力学': ['H. Callen, Thermodynamics', 'M. Kardar, Statistical Physics of Particles'],
    '逻辑与计算': ['G. Boolos et al., Computability and Logic', 'S. Aaronson, Quantum Computing Since Democritus'],
    '动力系统': ['R. Devaney, An Introduction to Chaotic Dynamical Systems', 'V. Arnold, Mathematical Methods of Classical Mechanics'],
    '调和分析': ['E. Stein & R. Shakarchi, Fourier Analysis', 'L. Grafakos, Classical Fourier Analysis'],
    '偏微分方程': ['L. Evans, Partial Differential Equations', 'F. John, Partial Differential Equations'],
    '可积系统': ['N. Ablowitz & P. Clarkson, Solitons, Nonlinear Evolution Equations and Inverse Scattering', 'M. Dunajski, Solitons, Instantons and Twistors'],
    '量子信息': ['M. Nielsen & I. Chuang, Quantum Computation and Quantum Information', 'J. Preskill, Lecture Notes on Quantum Computation'],
    '粒子物理': ['D. Griffiths, Introduction to Elementary Particles', 'M. Peskin & D. Schroeder, An Introduction to QFT'],
    '光学': ['M. Born & E. Wolf, Principles of Optics', 'E. Hecht, Optics'],
    '核物理': ['K. Krane, Introductory Nuclear Physics', 'A. Bohr & B. Mottelson, Nuclear Structure'],
    '代数拓扑': ['A. Hatcher, Algebraic Topology', 'E. Spanier, Algebraic Topology'],
    '几何/分析': ['A. Connes, Noncommutative Geometry', 'G. Emch, Algebraic Methods in Statistical Mechanics'],
    '几何/拓扑': ['M. Freedman & F. Luo, Selected Applications of Geometry to Low-Dimensional Topology', 'S. Donaldson & P. Kronheimer, The Geometry of Four-Manifolds'],
    '著名问题': ['J. Stillwell, Mathematics and Its History', 'K. Devlin, The Millennium Problems'],
}

DEFAULT_BOOKS = ['(see 关联课程 for related topics)', 'Graduate textbook recommended in 前沿 sections']

def add_reading(sid, category, body):
    books = TEXTBOOKS.get(category, DEFAULT_BOOKS)
    if '进一步阅读' in body or '教科书' in body:
        return body, False
    links = '\n'.join(
        f'<p>&rarr; <strong>{b}</strong></p>' for b in books
    )
    section = (
        '<section><h3>教科书与进一步阅读</h3>\n'
        f'<p>本课的博士级标准教材：</p>\n'
        f'{links}\n'
        '</section>\n'
    )
    # Insert before 关联课程 (handle numbered headings like 四、关联课程)
    m = re.search(r'<section>\s*<h3>[^<]*关联课程</h3>', body)
    if not m:
        return body, False
    new_body = body[:m.start()] + section + body[m.start():]
    return new_body, True

count = 0
with open('curriculum.json', 'r', encoding='utf-8') as f:
    lessons = json.load(f)

for l in lessons:
    sid = l['id']
    p = f'content/{sid}.html'
    if not os.path.exists(p):
        continue
    with open(p, 'r', encoding='utf-8') as f:
        body = f.read()
    new_body, changed = add_reading(sid, l['category'], body)
    if changed:
        with open(p, 'w', encoding='utf-8') as f:
            f.write(new_body)
        count += 1

print(f'Added reading list to {count}/{len(lessons)} courses')
