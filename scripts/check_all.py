"""Consolidated QA: counts, tag balance, tex-attr quotes, PUA, dead links, js syntax."""
import sys, glob, os, json, re, subprocess
sys.stdout.reconfigure(encoding='utf-8')
cur=[x['id'] for x in json.load(open('curriculum.json',encoding='utf-8'))]
ids=set(cur)
def pids(p): return {os.path.splitext(os.path.basename(f))[0] for f in glob.glob(p)}
html=pids('content/*.html'); js=pids('src/sketches/*.js'); pg=pids('pages/*.html')
missing=[x for x in cur if x not in html or x not in js or x not in pg]
print(f'curriculum {len(cur)} | missing files: {missing or "none"}')
bad=[]
for f in glob.glob('content/*.html'):
    c=open(f,encoding='utf-8').read(); b=os.path.basename(f)
    if c.count('<section>')!=c.count('</section>') or c.count('<div')!=c.count('</div>'):
        bad.append((b,'tag-balance'))
    if re.search(r'[\ue000-\uf8ff]',c): bad.append((b,'PUA'))
    for m in re.finditer(r'data-tex="', c):
        s=m.end(); gt=c.find('>',s)
        if gt!=-1 and c[s:gt].count('"')>=2: bad.append((b,'tex-quote'))
    for m in re.finditer(r'href="/pages/([^".]+)\.html"', c):
        if m.group(1) not in ids: bad.append((b,'deadlink->'+m.group(1)))
print('html issues:', len(bad))
for x in bad[:20]: print(' ',x)
jsfail=[]
for f in glob.glob('src/sketches/*.js'):
    if subprocess.run(['node','--check',f],capture_output=True).returncode!=0:
        jsfail.append(os.path.basename(f))
print('js syntax fails:', jsfail or 'none')
g=json.load(open('public/graph.json',encoding='utf-8')); s=json.load(open('public/search-index.json',encoding='utf-8'))
prereq=len(g.get('prereq_edges',[]))
print('graph', g['stats'], '| prereq_edges', prereq, '| search', len(s))
ok = not missing and not bad and not jsfail and prereq > 0
if prereq == 0: print('  graph.json missing prereq_edges (knowledge graph will collapse to one row)')
print('QA:', 'PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
