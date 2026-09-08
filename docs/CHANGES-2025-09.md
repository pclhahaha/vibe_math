# 2025-09 内容收尾记录（自动汇总）

## 本轮已完成
- **关键论文/延伸补齐**：122/122 课程均有论文/参考文献节；批量 16 批，约 66 门课受益（36 门补齐论文 + 其余补延伸/去重）。
- **图谱**：节点 122、边 585→604（大量新增跨课延伸链接）。
- **质量门**：`npm run check` 全绿（KaTeX 2171/0；HTML 平衡 0；死链 0；PUA 0）。
- **修复**：9 门插入节编号冲突（`七、延伸`→去编号）；`public/curriculum.json` 同步机制；首页 90→122 回退值；README/元描述去旧文案。

## 已建工具
- `scripts/audit_sections.py`（内容骨架体检 → docs/content-audit.md）
- `scripts/check_terms.py`（术语一致性 → docs/term-report.md）
- `scripts/check_katex.mjs`、`scripts/check_all.py`（`npm run check`）
