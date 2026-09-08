# 🌀 Vibe Math

> **交互式数学物理可视化实验室** — 122 门互动课程，从本科微积分到千禧年难题。  
> *Drag matrices. Flip spheres. Trace particles. Feel the math.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Lessons](https://img.shields.io/badge/Lessons-122-brightgreen)]()
[![p5.js](https://img.shields.io/badge/p5.js-v2.3-ED225D)]()
[![KaTeX](https://img.shields.io/badge/KaTeX-formulas-00C853)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](CONTRIBUTING.md)

---

## 🔭 这是什么

Vibe Math 把"抽象数学"变成你手里可以**拖拽、翻转、实时响应**的东西。每课 = 一个交画布 + 分析 + 公式 + 习题 + 跨课程知识网络。

三条主线：

| 难度 | 数量 | 目标读者 | 典型内容 |
|:---:|:---:|------|------|
| ★ 基础 | 15 | 大二本科生 | 线性变换、导数、黎曼积分、ε-δ、复平面 |
| ★★ 核心 | 54 | 大三/研究生 | 量子力学、微分几何、统计力学、相对论 |
| ★★★ 前沿 | 53 | 博士/研究级 | 千禧年问题、代数几何、模形式、Langlands |

### 每课组成

```
┌──────────────────────┬──────────────────────────┐
│  交互式画布 (p5.js)   │  文字层                   │
│                      │  一、直觉和类比             │
│  · 拖拽矩阵元素       │  二、定义与推导              │
│  · 滑动参数           │  三、核心洞察 (key insight) │
│  · 点击缩放           │  四、关键公式 (KaTeX)       │
│  · 实时响应           │  五、试试看 (交互练习)       │
│                      │  六、前沿进展                │
│                      │  七、关键论文引用             │
│                      │  + 关联课程 (可点击)          │
└──────────────────────┴──────────────────────────┘
```

---

## 📸 截屏

| 线性变换 | Bloch 球 | Lorenz 吸引子 | 分形 |
|:--:|:--:|:--:|:--:|
| ![线性变换](screenshots/linear-transform.gif) | ![Bloch](screenshots/bloch.gif) | ![Lorenz](screenshots/lorenz.gif) | ![分形](screenshots/fractal.gif) |

> 运行 `npm run dev` 打开浏览器，录屏后放入 `screenshots/` 文件夹即可替换。

---

## 🚀 快速开始

```bash
git clone https://github.com/你的用户名/vibe_math.git
cd vibe_math
npm install
npm run dev          # http://localhost:5173
npm run build        # 生产构建 → dist/
```

---

## 📋 课程地图

```
📐 数学 (50 门)
├── 线性代数: 线性变换 · 特征向量 · SVD · 行列式 · 谱定理
├── 微积分: 导数 · 梯度 · 黎曼积分 · ε-δ
├── 复分析: 复平面 · 围道积分 · 黎曼面 · 多复变
├── 分析: 实分析 · 测度论 · 泛函分析 · 变分法
├── 代数: 抽象代数 · 交换代数 · 伽罗瓦理论 · 泛代数
├── 几何: 测地线 · 曲率 · 平行移动 · 纤维丛 · 凸几何 · 辛几何
├── 拓扑: 基本群 · 同调论 · 纽结不变量 · Morse理论
├── 数论: 素数筛 · ζ函数 · 模形式 · 椭圆曲线(Wiles) · 哥德巴赫 · 孪生素数
├── 逻辑: Gödel · 图灵机 · Y组合子 · 证明论
├── 范畴: 伴随函子 · 高阶范畴论
└── 更多: 组合 · 图论与网络 · 分形 · 孤子 · 凸几何 ...

⚛️ 物理 (35 门)
├── 量子力学: Bloch球 · 谐振子 · 氢原子 · 不确定性 · 纠缠
├── 统计力学: Ising模型 · 熵 · 布朗运动 · Boltzmann
├── 相对论: 光锥 · Lorentz变换 · 引力透镜
├── 量子场论: 费曼图 · Higgs机制 · 标准模型
├── 凝聚态/量子信息/核物理/光学 ...
└── 著名问题: Hilbert 23 · 千禧年 · 庞加莱猜想 · 灵魂猜想
```

---

> **2025 更新：** 依据《普林斯顿数学指南》Part III–V 分五轮新增 32 门课（90→122）。前四轮共 27 门（图论、PDE、群表示论、P vs NP、椭圆曲线、微分形式、傅里叶、CLT、双曲、遍历、模型论、高维几何、密码、加性组合、拉普拉斯鼓、复动力、渗流、连分数、分岔、凸优化、Yang–Mills、代数数论、格密码、随机矩阵、鞅、曲面拓扑、紧李群表示）。第五轮收官：力迫与 CH、p-adic 数、谱序列、概形语言、几何测度论。

## 🔧 技术架构

| 层 | 技术 | 文件 |
|----|------|------|
| 构建 | Vite (rolldown) | `vite.config.js` |
| 可视化 | p5.js v2 | `src/sketches/*.js` |
| 公式 | KaTeX | `src/shared/katex-init.js` |
| 课程元数据 | JSON | `curriculum.json` |
| 内容 | HTML | `content/*.html` |
| 页面生成 | Python | `scripts/gen_lessons.py` |
| 全文搜索 | fuse.js + 索引 | `scripts/build_search.py` |
| 知识图谱 | p5.js 力导向 | `scripts/build_graph.py`, `graph.html` |

### 目录结构

```
vibe_math/
├── index.html / learn.html / quals.html / graph.html   # 主页 · 学习路径 · 资格考试 · 知识图谱
├── curriculum.json          # 课程元数据（90 门）
├── content/                 # 课程内容（博士级：证明+反例+工作题+阅读指引）
├── src/
│   ├── sketches/            # 90 个 p5.js 交互画布
│   └── shared/              # 共享 CSS/JS（侧边栏、KaTeX、快捷键）
├── pages/                   # 生成的课程页（勿手改）
├── public/                  # 静态资源 + graph.json + search-index.json
├── scripts/                 # Python 生成工具
└── dist/                    # 构建产物
```

### 生成流程

```bash
npm run gen          # 一键：生成页面 + 交叉引用 + 知识图谱 + 搜索索引
npm run gen:lessons  # 仅生成课程页
npm run gen:graph    # 仅重建知识图谱
npm run gen:search   # 仅重建全文搜索索引
npm run dev          # 本地开发
npm run build        # 生产构建
```

新增课程流程：`curriculum.json` → `content/{id}.html` → `src/sketches/{id}.js` → `npm run gen`。

---

## 🎓 面向博士级内容

前沿课程（★★★）包含：

- **精确化定义和证明概要** — 不只是"结论"，展示推理路径
- **标准反例** — 区分专家理解与教科书理解的病理例子
- **带解答工作题** — 折叠显示答案的资格考试风格练习
- **关键论文引用** — 列出 landmark paper 的作者、年份、影响力
- **教科书阅读指引** — 每课指向标准研究生教材
- **开放问题** — 当前研究的 front line：什么还不知道？为什么难？
- **跨学科链接** — 代数几何 ↔ 数论，量子混沌 ↔ 随机矩阵，etc.

示例主题：Riemann ζ函数的精确素数公式、Deligne的Weil猜想证明、Wiles的 R=T 定理、perfetoid空间的算术几何、Dvir的有限域Kakeya一行证明。

---

## 🤝 贡献

所有类型都欢迎：

- **新增课程** — 加 `curriculum.json` + `content/文字.html` + `src/sketches/画布.js`，跑 `npm run gen`
- **丰富内容** — 改进现有课程文字/公式/前沿进展
- **优化画布** — 改进 p5.js 交互、性能、响应式
- **修正错误** — 数学/物理/代码 bug
- **更多语言** — 目前是中文，欢迎英文翻译

详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 🚀 部署到 GitHub Pages

项目已内置 GitHub Actions 工作流（`.github/workflows/deploy.yml`），push 到 `main` 分支自动构建部署。

### 用户主页（`username.github.io`）

无需额外配置，直接 push 即可：

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/你的仓库.git
git push -u origin main
```

### 项目子路径（`username.github.io/仓库名/`）

设置 GitHub 变量 `VITE_BASE=/仓库名/`：

1. GitHub 仓库 → **Settings → Secrets and variables → Actions → Variables**
2. New repository variable：`VITE_BASE` = `/仓库名/`（如 `/vibe_math/`）
3. push 触发部署，自动用正确 base 重新生成并构建

### 部署后启用 Pages

仓库 **Settings → Pages → Source** 选 **GitHub Actions**，然后访问 `https://你的用户名.github.io/仓库名/`。

---

## 🙏 灵感

- [3Blue1Brown](https://www.3b1b.co/) — 数学动画的黄金标准
- [Immersive Math](http://immersivemath.com/) — 互动线性代数
- [Distill.pub](https://distill.pub/) — 视觉驱动学术论文
- [Explorable Explanations](https://explorabl.es/) — Nicky Case
- [NIST Digital Library of Mathematical Functions](https://dlmf.nist.gov/)
- [nLab](https://ncatlab.org/) — 数学/物理的维基式百科全书

---

## 📄 License

MIT — 自由使用、修改、分发。引用来源欢迎。
