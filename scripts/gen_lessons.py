import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)  # anchor all relative paths to project root

# Base path for GitHub Pages subpath deployment (VITE_BASE=/repo-name/)
BASE = os.environ.get('VITE_BASE', '/')
if not BASE.endswith('/'):
    BASE += '/'

with open('curriculum.json', 'r', encoding='utf-8') as f:
    lessons = json.load(f)

lesson_ids = [l['id'] for l in lessons]

sidebar_html = f'''<div class="sidebar-overlay" onclick="document.querySelector('.sidebar').classList.remove('open')"></div>
<nav class="sidebar">
  <div class="sidebar-header"><a href="{BASE}" style="text-decoration:none;color:inherit"><h2>&#127744; Vibe Math</h2></a><p><a href="{BASE}learn.html" style="color:#58a6ff">&#127760; 路径</a> · <a href="{BASE}graph.html" style="color:#58a6ff">&#129504; 图谱</a> · <a href="{BASE}quals.html" style="color:#58a6ff">&#127961; 考试</a> · <a href="{BASE}" style="color:#58a6ff">首页</a></p></div>
</nav>
<button class="sidebar-toggle" onclick="document.querySelector('.sidebar').classList.toggle('open')">&#9776;</button>
'''

# Progress button + script; inserted AFTER PAGE.format() via marker substitution,
# so its JS braces never clash with str.format.
PROG_HTML = (
    '<div style="margin:6px 0">'
    '<button id="doneBtn" style="background:#161b22;border:1px solid #30363d;color:#8b949e;border-radius:6px;padding:3px 12px;font-size:.8em;cursor:pointer">标记完成</button>'
    '<span id="doneStat" style="color:#3fb950;font-size:.75em;margin-left:8px"></span>'
    '</div>'
    '<script>'
    "(function(){try{var k='vm_done_v1',s=JSON.parse(localStorage.getItem(k)||'{}'),id='__ID__',"
    "b=document.getElementById('doneBtn'),st=document.getElementById('doneStat');"
    "function paint(){b.textContent=s[id]?'\\u2713 已完成':'标记完成';"
    "b.style.borderColor=s[id]?'#3fb950':'#30363d';b.style.color=s[id]?'#3fb950':'#8b949e';"
    "st.textContent=Object.keys(s).filter(function(x){return s[x]}).length+'/__TOTAL__ 已完成';}"
    "b.addEventListener('click',function(){s[id]=!s[id];localStorage.setItem(k,JSON.stringify(s));paint();});"
    'paint();}catch(e){}})();'
    '</script>'
)

PAGE = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="{subtitle}" />
  <meta property="og:title" content="{title} — Vibe Math" />
  <meta property="og:description" content="{subtitle}" />
  <title>{title} — Vibe Math</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="stylesheet" href="/src/shared/lesson.css" />
  <link rel="stylesheet" href="/src/shared/mobile.css" />
</head>
<body>
<div class="progress-bar" id="progress-bar"></div>
<div class="toc-toggle" id="toc-toggle" title="目录">☰</div>
''' + sidebar_html.format(total=len(lessons)) + '''
<div class="lesson-layout">
  <div class="sketch-col">
    <h2>{emoji} {title} <span style="font-size:.55em;padding:2px 8px;border-radius:4px;background:#1a3a1a;color:#7ee787;vertical-align:middle">{tier}</span></h2>
    <p class="subtitle">{subtitle}</p>
    <span class="cat-tag">{category}</span>
    __PROGRESS_MARKER__
    <div id="p5canvas"></div>
    <p class="kb-hint">&larr; &rarr; 切换课程 &middot; B 展开目录 &middot; Esc 关闭</p>
    {nav_row}
  </div>{content_col}
</div>
<button class="back-top" id="back-top" title="回到顶部">&uarr;</button>
<script type="module" src="/src/sketches/{sid}.js"></script>
<script type="module" src="/src/shared/base-patch.js"></script>
<script type="module" src="/src/shared/lesson-init.js"></script>
</body>
</html>'''

NAV_HTML = '''
<div class="lesson-nav" style="display:flex;justify-content:space-between;margin-top:12px;gap:8px">
  <a href="{prev_url}" id="prev-lesson" style="visibility:{prev_vis};background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:6px 16px;border-radius:6px;text-decoration:none;font-size:.85em">&larr; {prev_title}</a>
  <a href="{next_url}" id="next-lesson" style="visibility:{next_vis};background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:6px 16px;border-radius:6px;text-decoration:none;font-size:.85em">{next_title} &rarr;</a>
</div>'''

deep_count = 0
for i, lesson in enumerate(lessons):
    sid = lesson['id']
    content_file = f'content/{sid}.html'

    if os.path.exists(content_file):
        with open(content_file, 'r', encoding='utf-8') as f:
            body = f.read().strip()
        content_col = f'\n  <div class="content-col deep">\n{body}\n  </div>'
        deep_count += 1
    else:
        content_col = f'\n  <div class="content-col">\n    <section><h3>{lesson["emoji"]} {lesson["title"]}</h3>\n    <p>{lesson["desc"]}</p>\n    </section>\n  </div>'

    prev_idx = i - 1
    next_idx = i + 1

    if prev_idx >= 0:
        prev_lesson = lessons[prev_idx]
        prev_data = {'prev_url': BASE + 'pages/' + prev_lesson['id'] + '.html',
                     'prev_title': prev_lesson['emoji'] + ' ' + prev_lesson['title'],
                     'prev_vis': 'visible'}
    else:
        prev_data = {'prev_url': '#', 'prev_title': '', 'prev_vis': 'hidden'}

    if next_idx < len(lessons):
        next_lesson = lessons[next_idx]
        next_data = {'next_url': BASE + 'pages/' + next_lesson['id'] + '.html',
                     'next_title': next_lesson['emoji'] + ' ' + next_lesson['title'],
                     'next_vis': 'visible'}
    else:
        next_data = {'next_url': '#', 'next_title': '', 'next_vis': 'hidden'}

    nav_row = NAV_HTML.format(**prev_data, **next_data)

    html = PAGE.format(
        title=lesson['title'], emoji=lesson['emoji'], tier=lesson.get('tier', '★★'),
        subtitle=lesson['desc'], category=lesson.get('part', lesson['category']),
        sid=sid, content_col=content_col, nav_row=nav_row
    )
    html = html.replace('__PROGRESS_MARKER__', PROG_HTML.replace('__ID__', sid).replace('__TOTAL__', str(len(lessons))))
    with open(f'pages/{sid}.html', 'w', encoding='utf-8') as f:
        f.write(html)

# Keep the served copy of curriculum metadata in sync (public/ is copied by Vite)
import shutil
shutil.copyfile('curriculum.json', 'public/curriculum.json')

print(f'{len(lessons)} pages ({deep_count} with deep content)')
