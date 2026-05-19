# mdpress

> **在命令行里，一键得到 Typora 品质的 PDF。**

将 Markdown 导出为具有 **Typora 级视觉品质** 的 PDF——**无需打开 Typora，无需安装 4GB LaTeX，无需手写 CSS**。一行命令，搞定公式、图表、代码高亮与精美排版。

```bash
node scripts/md2pdf.js thesis.md --toc
# 输出 thesis.pdf，自带目录、LaTeX 公式、Mermaid 流程图
```

---

## ✨ 为什么选择它？

市面上的 Markdown 转 PDF 工具，总让你在 **"效果"**、**"自动化"**、**"功能"** 之间做取舍：

| 方案 | 公式 | Mermaid | 脚注/任务列表 | 自动化 | 接近 Typora |
|------|:--:|:-------:|:-----------:|:----:|:---------:|
| Typora / Obsidian 导出 | ✅ | ✅ | ✅ | ❌ GUI  only | ✅ |
| Pandoc + LaTeX | ✅ | ❌ | ⚠️ | ✅ | ❌ 学术风 |
| markdown-pdf (npm) | ❌ | ❌ | ❌ | ✅ | ❌ 太简陋 |
| md-to-pdf (npm) | ⚠️ | ❌ | ❌ | ✅ | ❌ 功能弱 |
| WeasyPrint | ❌ | ❌ | ❌ | ✅ | ❌ 无 JS 引擎 |
| VS Code Markdown PDF | ✅ | ⚠️ | ⚠️ | ❌ 插件 | ✅ |
| **本工具** | **✅** | **✅** | **✅** | **✅ CLI** | **✅** |

**本工具是唯一同时满足以下三点的方案：**

1. **🎨 Typora 级渲染** —— 复用 Typora 官方 CSS 主题，不是 LaTeX 的学术排版，是熟悉的现代文档风格
2. **🤖 完全命令行自动化** —— 适合 AI Agent、CI/CD、批量脚本，无需打开任何 GUI
3. **📐 扩展语法全支持** —— LaTeX 公式、Mermaid 图表、脚注、任务列表、YAML 元数据、代码高亮，全部原生支持

---

## 🚀 一行命令，即刻使用

```bash
# 基础导出
node scripts/md2pdf.js report.md

# 带目录 + 暗色主题 + 自定义边距
node scripts/md2pdf.js report.md --toc --theme night --margin 15mm

# 复杂技术文档（公式 + 流程图 + 代码高亮）
node scripts/md2pdf.js thesis.md thesis.pdf --toc --highlight-style zenburn
```

---

## 实现原理

Typora 本身**未提供 CLI 导出接口**（官方 issue #4261 / #6528 长期悬而未决），且没有 AppleScript / SDEF 字典，无法通过系统脚本直接驱动导出菜单。

本方案采用 **"Pandoc 解析 + Typora CSS 渲染 + Headless Chrome 打印"** 的三段式架构，在纯命令行环境下复刻 Typora 的导出效果：

```
┌─────────────┐    Pandoc (全扩展)    ┌─────────────┐    Chrome Headless    ┌─────┐
│  input.md   │ ────────────────────▶ │  styled.html│ ────────────────────▶ │ PDF │
└─────────────┘  + Typora CSS 主题    └─────────────┘  Puppeteer / CLI      └─────┘
                                                        等待 KaTeX/Mermaid
                                                        渲染完成后打印
```

**技术细节**：
- **Pandoc 3.x**：负责将 Markdown 解析为 HTML，启用全部扩展语法（GFM、LaTeX 数学、脚注、任务列表、YAML metadata、表格等）。
- **Typora 主题 CSS**：提取自 Typora 安装包（`github.css` 等），修正字体路径为 CDN / 系统字体栈，确保 Headless Chrome 可正确加载。
- **Headless Chrome**：通过 Puppeteer 或 Chrome CLI 加载 HTML，在浏览器内完成 KaTeX 公式排版和 Mermaid 图表渲染后，调用打印功能生成 PDF。
- **Node.js 编排脚本**（`scripts/md2pdf.js`）：统一封装 Pandoc 参数注入、HTML 后处理（Mermaid 代码块转换）、Chrome 调用、临时文件清理。

---

## 特性

| 特性 | 说明 |
|------|------|
| 📝 **全扩展 Markdown** | Pipe/Grid 表格、LaTeX 数学、任务列表、脚注、定义列表、上下标、删除线、智能引号、YAML 元数据 |
| 📐 **数学公式** | 支持 `$...$` 行内公式与 `$$...$$` 块级公式，默认 KaTeX（极速同步渲染），可选 MathJax |
| 🧜 **Mermaid 图表** | 支持流程图、时序图、类图、状态图等，浏览器内实时渲染为 SVG 后入 PDF |
| 🎨 **Typora 主题** | 内置 `github` 主题，支持读取本机 Typora 主题目录（`auto` 模式），可手动添加 `.css` 扩展 |
| 📑 **自动生成目录** | `--toc` 基于标题层级自动生成可点击目录 |
| 💻 **代码高亮** | 集成 Pandoc Skylighting，支持 `tango`、`pygments`、`zenburn`、`kate` 等风格 |
| 📄 **页面控制** | A4 / Letter 等纸张、自定义四边边距 |
| 🖥️ **跨平台** | macOS / Linux / Windows（需 Pandoc + Node + Chrome） |

---

## 安装

### 1. 克隆仓库

```bash
git clone https://github.com/deadpoppy/mdpress.git ~/.agents/skills/mdpress
```

### 2. 安装系统依赖

**macOS**（Homebrew）：
```bash
brew install pandoc
# Chrome 浏览器需自行安装（官方下载或已安装均可）
# Node.js 建议 v18+，若未安装：brew install node
```

**Ubuntu / Debian**：
```bash
sudo apt-get update
sudo apt-get install -y pandoc nodejs npm chromium-browser
```

**Arch**：
```bash
sudo pacman -S pandoc nodejs npm chromium
```

### 3. 安装可选依赖（强烈推荐）

```bash
npm install -g puppeteer
```

> 有 `puppeteer` 时，脚本会启动 Chrome 实例并**等待 Mermaid 图表和 KaTeX 公式渲染完成**后再打印 PDF；否则 fallback 到 Chrome CLI，基础文档正常，但复杂图表/公式可能渲染不全。

### 4. 验证安装

```bash
cd ~/.agents/skills/mdpress
node scripts/md2pdf.js --help
```

---

## 使用方法

### 基本导出

```bash
node scripts/md2pdf.js document.md
# 输出 document.pdf（与输入同目录）
```

### 指定输出路径

```bash
node scripts/md2pdf.js document.md /path/to/output.pdf
```

### 常用参数组合

```bash
# 带目录 + 暗色主题 + 窄边距
node scripts/md2pdf.js report.md report.pdf --toc --theme night --margin 15mm

# 使用 MathJax 渲染公式（兼容部分复杂 LaTeX 宏）
node scripts/md2pdf.js thesis.md --mathjax

# 代码高亮换风格
node scripts/md2pdf.js code.md --highlight-style zenburn

# 仅渲染目录到 2 级标题
node scripts/md2pdf.js book.md --toc --toc-depth 2
```

### 参数速查

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--theme <name>` | `github` | 主题：`github`、`newsprint`、`night`、`gothic`、`pixyll`、`auto` |
| `--toc` | 关闭 | 生成目录 |
| `--toc-depth <n>` | `3` | 目录收录的标题深度 |
| `--katex` | **开启** | 使用 KaTeX 渲染数学公式 |
| `--mathjax` | 关闭 | 使用 MathJax 渲染数学公式 |
| `--page-size <size>` | `A4` | 纸张：`A4`、`Letter`、`Legal` 等 |
| `--margin <val>` | `20mm` | 统一四边边距 |
| `--margin-top` 等 | — | 单独控制某一边距 |
| `--highlight-style` | `tango` | 代码高亮主题 |

---

## 作为 Kimi Skill 使用

本仓库同时是一个 **Kimi Code CLI Skill**，安装后 Kimi Agent 可直接调用：

```bash
# 安装到 Kimi skills 目录
git clone https://github.com/deadpoppy/mdpress.git ~/.agents/skills/mdpress
```

安装后，对 Kimi 说：

> "帮我把 `report.md` 导出成 PDF，要带上目录，用 night 主题。"

Kimi 会自动识别 `mdpress` skill，并执行：

```bash
node ~/.agents/skills/mdpress/scripts/md2pdf.js report.md report.pdf --toc --theme night
```

---

## 文件结构

```
mdpress/
├── README.md                 # 本文件（人类 + Agent 阅读）
├── SKILL.md                  # Kimi Skill 元数据与指令（Agent 核心入口）
├── scripts/
│   └── md2pdf.js             # 主脚本：编排 Pandoc → HTML → PDF 全流程
└── assets/
    ├── template.html         # Pandoc HTML5 模板（内容注入 #write 容器，适配 Typora CSS）
    ├── github.css            # 默认主题（提取自 Typora，字体改为 CDN / 系统栈）
    └── ...                   # 可扩展更多 .css 主题文件
```

### 关键文件说明

- **`scripts/md2pdf.js`**
  - 解析命令行参数
  - 调用 `pandoc` 生成自包含 HTML（启用全部 Markdown 扩展 + KaTeX）
  - 后处理 HTML：将 ` ```mermaid ` 代码块转换为 `<div class="mermaid">`
  - 通过 Puppeteer / Chrome CLI 打印 PDF
  - 自动清理临时 HTML

- **`assets/template.html`**
  - 基于 Pandoc 默认 HTML5 模板修改
  - 将 `$body$` 包裹在 `<div id="write">` 中，与 Typora 的 DOM 结构一致，使 Typora CSS 无需改动即可生效

- **`assets/github.css`**
  - 提取自 `/Applications/Typora.app/Contents/Resources/TypeMark/style/themes/github.css`
  - 移除本地字体文件引用（`./github/*.woff2`），替换为 Google Fonts CDN `@import`
  - 添加 `@media print` 优化分页（避免表格/代码块被截断）

---

## 自定义主题

### 方式一：使用本机 Typora 主题（自动）

若已安装 Typora，使用 `--theme auto`：

```bash
node scripts/md2pdf.js note.md --theme auto
```

脚本会按以下顺序查找主题：
1. macOS: `~/Library/Application Support/abnerworks.Typora/themes/github.css`
2. 内置: `assets/github.css`

### 方式二：手动添加主题

1. 从 Typora 主题目录复制 `.css` 到 `assets/`
2. 若主题依赖字体文件，将字体文件一并放入 `assets/` 并在 CSS 中修改为相对路径
3. 使用 `--theme <filename_without_ext>`

---

## 故障排除

### Chrome / Chromium 找不到

**现象**：`Google Chrome / Chromium not found`

**解决**：
```bash
# macOS
open -a "Google Chrome"  # 确认已安装
# 或指定 Edge
node scripts/md2pdf.js doc.md --chrome-path "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"

# Linux
sudo apt-get install chromium-browser
```

### Puppeteer 未找到

**现象**：`Puppeteer not found, falling back to Chrome CLI`

**解决**：
```bash
npm install -g puppeteer
```

Fallback 模式下基础 Markdown 正常，但 **Mermaid 图表可能显示为代码块**，复杂公式可能渲染不全。

### Mermaid 图表未渲染

**现象**：PDF 中流程图显示为纯文本代码块

**解决**：
1. 安装 `puppeteer`（必须）
2. 确保机器能访问 CDN（`cdn.jsdelivr.net`）以下载 `mermaid@10`
3. 检查 markdown 中代码块标记是否为精确的 ` ```mermaid `

### 公式显示为源码

**现象**：`$E=mc^2$` 显示为原始 LaTeX 代码

**解决**：
- 默认使用 KaTeX，对绝大多数公式有效。若遇到不支持的 LaTeX 宏，切换 MathJax：
  ```bash
  node scripts/md2pdf.js doc.md --mathjax
  ```
- 确保公式使用标准 Pandoc 语法：`$...$`（行内）、`$$...$$`（块级）

---

## 依赖清单

| 依赖 | 用途 | 必需 |
|------|------|------|
| [Pandoc](https://pandoc.org/) ≥ 3.0 | Markdown → HTML 解析 | ✅ |
| [Node.js](https://nodejs.org/) ≥ 18 | 脚本运行环境 | ✅ |
| Google Chrome / Chromium / Edge | HTML → PDF 打印 | ✅ |
| [Puppeteer](https://pptr.dev/) | 控制 Chrome 等待 JS 渲染 | ❌ 强烈推荐 |

---

## License

MIT
