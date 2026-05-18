---
name: typora-pdf-export
description: Convert Markdown files to beautifully styled PDFs using Pandoc and headless Chrome with Typora-like rendering. Supports extended Markdown syntax including tables, LaTeX math (KaTeX/MathJax), Mermaid diagrams, task lists, footnotes, and syntax highlighting. Use when the user needs to export a .md file to PDF with high-quality typography, math formulas, code blocks, or diagrams, especially when Typora itself lacks a CLI export option.
---

# Typora PDF Export

Convert Markdown to PDF with Typora-like visual quality, fully automated via command line.

## How It Works

1. **Pandoc** converts Markdown to HTML with all extensions enabled (GFM, math, tables, diagrams, footnotes, etc.).
2. **Typora-inspired CSS** (GitHub theme by default) styles the document.
3. **Headless Chrome** (via Puppeteer or Chrome CLI) renders the HTML and prints a PDF.
4. **Mermaid** diagrams and **KaTeX** math are rendered in the browser before PDF generation.

## Requirements

- **pandoc** (v3.0+ recommended)
- **Node.js** (v18+)
- **Google Chrome** / Chromium / Microsoft Edge
- **puppeteer** (optional but recommended for Mermaid and math): `npm install -g puppeteer`

## Usage

```bash
node scripts/md2pdf.js <input.md> [output.pdf] [options]
```

### Examples

```bash
# Basic export
node scripts/md2pdf.js report.md

# Specify output and theme
node scripts/md2pdf.js report.md report.pdf --theme github

# With table of contents
node scripts/md2pdf.js report.md --toc --toc-depth 2

# Use MathJax instead of KaTeX
node scripts/md2pdf.js report.md --mathjax

# Custom page margins
node scripts/md2pdf.js report.md --margin 15mm --page-size A4
```

### Options

| Option | Description |
|--------|-------------|
| `--theme <name>` | Theme: `github`, `newsprint`, `night`, `gothic`, `pixyll`, `auto`. Default: `github`. If Typora is installed, `auto` reads from Typora's theme directory. |
| `--toc` | Include table of contents |
| `--toc-depth <n>` | TOC heading depth (default: 3) |
| `--katex` | Use KaTeX for math rendering (default) |
| `--mathjax` | Use MathJax for math rendering |
| `--page-size <size>` | Page size: `A4`, `Letter`, etc. (default: `A4`) |
| `--margin <val>` | All margins (default: `20mm`) |
| `--margin-{top,right,bottom,left} <val>` | Individual margins |
| `--highlight-style <style>` | Code highlight style: `tango`, `pygments`, `kate`, `zenburn`, etc. |
| `-h, --help` | Show help |

## Supported Markdown Extensions

All Pandoc Markdown extensions are enabled by default:

- Pipe tables, grid tables, multiline tables
- LaTeX math (`$...$`, `$$...$$`)
- Task lists (`- [x] Done`)
- Footnotes
- Definition lists
- Smart quotes/dashes
- Autolinks
- Strikeout
- Subscript/superscript
- YAML metadata block (title, author, date)
- Implicit figures
- Fenced divs
- Emoji
- Mermaid diagrams (in fenced code blocks labeled `mermaid`)

## Custom Themes

Place additional `.css` files in `assets/`. The script searches in this order:

1. Built-in `assets/<theme>.css`
2. Typora themes directory (macOS: `~/Library/Application Support/abnerworks.Typora/themes`)

To extract a theme from Typora manually, copy the `.css` and any required font files into `assets/`.

## Troubleshooting

**Chrome not found**
- Install Google Chrome or Chromium. Edge is also supported.

**Puppeteer not found**
- Install globally: `npm install -g puppeteer`
- Fallback Chrome CLI works for basic documents, but Mermaid diagrams and complex math may not render fully.

**Mermaid diagrams not showing**
- Requires Puppeteer + internet access (CDN download) or a local cached copy of mermaid.js.
- The script converts ` ```mermaid ` code blocks to `<div class="mermaid">` dynamically.

**Formulas not rendering**
- Ensure `--katex` or `--mathjax` is used. KaTeX is faster and recommended for headless mode.
