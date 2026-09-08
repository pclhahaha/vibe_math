# Vibe Math — 内容与术语规范（P2 一致性基座）

> 供新增课程与统一修订时参考。目标：让 122 门课在**术语、写法、结构、链接**上保持一致，
> 也作为自动化 QA（`npm run check`）之外的**人工复查清单**。

## 1. 全局数字（勿手写，改课程时以 `npm run gen` 自动为准）
- 课程总数：122（基础 15 · 核心 54 · 前沿 53）；图谱节点=页面=搜索=122。
- 数字文案：`README.md`、`index.html` 副标题、`learn.html` 导语、`quals.html` 无需手改总数字符——
  但若在别处手写了"门数"，请同步。
- 质量门：改任何 `content/`、`src/sketches/`、`curriculum.json` 后必须 `npm run gen && npm run check`。

## 2. 元数据规范（`curriculum.json`）
| 字段 | 约定 |
|---|---|
| `id` | kebab-case 英文（与文件名一致），如 `elliptic-curves` |
| `title` | 中文，不写英文；课名可含符号（如 `P vs NP`、`Yang–Mills`） |
| `emoji` | 全库唯一（新增前先查重） |
| `category` | 用既有 42 类之一；确需新类再新增并在图谱自然着色 |
| `tier` | `★` / `★★` / `★★★`；`part` 与 tier 对齐（★→Part1 基础，★★→Part2 核心，★★★→Part3 前沿与问题） |
| `desc` | 一句含交互点的中文短句，建议 ≤ 28 字，用作页面 meta 与搜索 |

## 3. 内容文件结构（`content/{id}.html`）
按"kakeya 标准"固定骨架，新增课程照抄：
```
<section> 〇、直觉入门（+ <div class="key-insight">洞察…</div>）</section>
<div class="key-insight" style="border-left-color:#f78166">⚠️ 背景提示（前置建议，含课程链接）</div>
<section>一、一个具体问题 … 二、直觉→严格 … 三/四、例题 N（一步步算完）
… 五、严格陈述 六、关键公式 七、延伸 八、反例与陷阱 九、当前状态
… 关键论文（作者+年份+一行影响）
… 工作题（<details><summary>显示解答</summary>）
… 试试看（练习与提示）
… 教科书与进一步阅读
… 前置知识（<h3>前置知识</h3>，只放本课直接前提）
… 关联课程（<h3>关联课程</h3>，6 条左右，跨分支更佳）
```
约束：
- **HTML 平衡**：`<section>`/`<div>`/`<p>` 必须配对（check_all 强制）；别在段尾多加 `</div>`。
- **公式**：整块公式用 `<div class="formula display" data-tex="…">`；`data-tex` 值内**禁用裸 ASCII 引号**与裸 `<`、`>`（用 `<`/`>` 也可但一律先写实体再让浏览器解码）；**禁用裸 `%`**（TeX 注释会吃掉 `}`，必须写 `\%`）；括号用 `\Bigl/\Bigr`、`\left/\right` 配对。
- **内联符号**：正文里用 Unicode（≤ ≥ ≠ ℝ ℤ ℂ ∫ → ⟹ √），不要用 ASCII 近似（<= 之类）。
- **人名**：一律拉丁原拼（Gödel、Wiles、Cohen、Perelman、Grothendieck…），与课程标题一致；正文不必翻成中文。
- **术语首选**（修订时用左侧、避免右侧）：见 §4 术语表。

## 4. 术语表（核心，建议统一写法）
| 领域 | 首选 | 避免/备注 |
|---|---|---|
| 分析 | 测度论 · 可测函数 | "勒贝格测度论"（可并行但统一为测度论） |
| | 欧拉示性数 χ | "欧拉数/特征数"（欧拉数另有含义，优先示性数） |
| | 上确界/下确界 | "最小上界"仅在首次解释用 |
| | 几乎处处 | 不用缩写形式（页面内全称） |
| 拓扑/几何 | 亏格 g | "孔数"只在口语 |
| | 纤维化/纤维丛 | "纤维空间"统一为纤维化（映射）或纤维丛（对象） |
| | 单连通/可缩 | 严格区分 |
| 代数 | 理想类群/类数 h | "理想类群"统一 |
| | 正规子群（不写"不变子群"） | |
| | 表示的不可约/完全可约 | |
| 数论 | ζ 函数（ζ 后带空格） | `ζ函数` 不要连写 |
| | p-adic 数 | 不译"p进数"?可并行但教程用 p-adic |
| | 连续统假设 CH | |
| 概率 | 鞅、停时、滤流 | 首次出现给英文 (martingale/stopping time) |
| | 分布收敛/依概率收敛/几乎必然收敛 | 三种模式严格区分 |
| 逻辑/基础 | 力迫 (forcing)、可构造宇宙 L | |
| | 一阶逻辑/模型论 | |
| 物理 | 规范场/联络/曲率 | 遵循纤维丛课用法 |
| 通用 | 维度/维数 | 统计、几何里统一"维数"；仅高维直觉可用"维度" |

## 5. 画布规范（`src/sketches/{id}.js`）
- 必须 p5 实例模式 `const sketch = (p) => {…} new p5(sketch);`；统一首行声明 `pixelDensity(min(dpr,2))`（已全局注入，勿删）。
- UI 文案中文（按钮不要英文），控件 append 到 `.sketch-col`。
- 重计算（特征值/DFT/蒙特卡洛）只在 `change` 事件重算；画布尺寸宽 ≤ 视觉容器（多数已 `Math.min(w, windowWidth-40)`）。
- 避免魔法数字突兀：坐标以 `p.width/p.height` 派生为佳。

## 6. 链接与生成
- 内容里的课程链接一律 `/pages/{id}.html`；id 必须是 `curriculum.json` 存在的（死链会被 check 拦截）。
- 新课程四件套：`curriculum.json` 条目 → `content/{id}.html` → `src/sketches/{id}.js` → 可选 `learn.html` 路径与 `quals.html` 考题；然后 `npm run gen && npm run check`。
- 所有生成产物（`pages/`、`public/graph.json`、`public/search-index.json`）需提交；CI 会强制它们与源码一致。

## 7. 建议的复查节奏（人工，浏览器）
1. 打开新课程页：公式无红字、画布可交互、文字无乱码/折行异常。
2. 抽查 `quals.html` 链接可跳转、解答与题目一致。
3. 抽查图谱：分类/难度筛选后节点计数合理、前置边方向正确（前→后）。
4. 手机宽度：画布等比缩放后控件仍可用（点击/拖动走 touch shim）。

— 2025 · 与 `npm run check` 配合使用
