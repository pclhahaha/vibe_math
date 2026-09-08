# Contributing to Vibe Math

Thanks for helping make interactive math education better.

## How to add a new lesson

1. Add entry to `curriculum.json`:
```json
{"id":"my-topic","title":"My Topic","emoji":"📐","category":"Math","desc":"Short description","tier":"★★"}
```

2. Create content: `content/my-topic.html`
```html
<section><h3>Section Title</h3><p>Content...</p></section>
<div class="key-insight">Key takeaway</div>
<div class="formula display" data-tex="E=mc^2"></div>
```
推荐博士级结构：严格定义/证明 + 标准反例 + 带解答的工作题（`<details><summary>显示解答</summary>`）+ 教科书阅读指引。

3. Create sketch: `src/sketches/my-topic.js`
```js
import p5 from 'p5';
const sketch = (p) => {
  p.setup = () => { p.createCanvas(500, 380).parent('p5canvas'); };
  p.draw = () => { /* your code */ };
};
new p5(sketch);
```

4. 重新生成所有产物：
```bash
npm run gen   # 页面 + 交叉引用 + 知识图谱 + 搜索索引
```

## 生成管线

```
scripts/
├── gen_lessons.py     # curriculum + content → pages/*.html
├── gen_crossrefs.py   # 自动补全课程间交叉引用
├── build_graph.py     # 交叉引用 → public/graph.json（知识图谱）
├── build_search.py    # 课程正文 → public/search-index.json（全文搜索）
└── add_reading.py     # 教科书阅读指引
```

## Style guide

- 用 `<strong>` 强调，不用加粗斜体
- 公式：`<div class="formula display" data-tex="...">` (KaTeX)
- 核心洞察：`<div class="key-insight">...</div>`
- 章节：`<section><h3>Title</h3>...</section>`
- 交互控件在 `setup()` 里用 `document.createElement` 创建，append 到 `.sketch-col`
- **不要用 `p.setLineDash`**（p5 v2 已移除），用 `p.drawingContext.setLineDash`

## Project structure

```
content/{id}.html      — 博士级内容（可独立编辑）
src/sketches/{id}.js   — p5.js 交互画布
pages/{id}.html        — 生成的页面（勿手改，跑 npm run gen）
curriculum.json        — 课程元数据
scripts/               — Python 生成工具
public/                — 静态资源 + graph.json + search-index.json
```

## License

MIT — your contributions will be under the same license.
