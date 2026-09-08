"""Build search-index.json from course content for full-text search."""
import json, os, re, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)  # anchor to project root

with open('curriculum.json', 'r', encoding='utf-8') as f:
    lessons = json.load(f)

def strip_html(s):
    s = re.sub(r'<[^>]+>', ' ', s)  # remove tags
    s = html.unescape(s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

index = []
for l in lessons:
    sid = l['id']
    p = f'content/{sid}.html'
    body_text = ''
    if os.path.exists(p):
        c = open(p, encoding='utf-8').read()
        body_text = strip_html(c)
        # keep only the first ~1200 chars of body text for indexing efficiency
        body_text = body_text[:2000]
    index.append({
        'id': sid,
        'title': l['title'],
        'desc': l['desc'],
        'category': l['category'],
        'content': body_text,
    })

with open('public/search-index.json', 'w', encoding='utf-8') as f:
    json.dump(index, f, ensure_ascii=False)

print(f'Search index: {len(index)} courses indexed')
total_chars = sum(len(x['content']) for x in index)
print(f'Total indexed content: {total_chars} chars')
