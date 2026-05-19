#!/usr/bin/env node
/**
 * md2pdf.js - Markdown to PDF converter with Typora-like rendering
 * Requires: pandoc, node.js, puppeteer (optional), Google Chrome
 */
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ===================== Utility =====================
function findChrome() {
    const candidates = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
    ];
    for (const c of candidates) if (fs.existsSync(c)) return c;
    try { return execSync('which google-chrome').toString().trim(); } catch (e) {}
    try { return execSync('which chromium').toString().trim(); } catch (e) {}
    try { return execSync('which chrome').toString().trim(); } catch (e) {}
    try { return execSync('which microsoft-edge').toString().trim(); } catch (e) {}
    return null;
}

function findPuppeteer() {
    const candidates = [
        'puppeteer',
        '/opt/homebrew/lib/node_modules/puppeteer',
        '/opt/homebrew/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer',
        '/usr/local/lib/node_modules/puppeteer',
    ];
    for (const c of candidates) {
        try { const mod = require(c); return { mod, path: c }; }
        catch (e) { /* ignore */ }
    }
    return null;
}

function findTyporaThemes() {
    const candidates = [
        path.join(os.homedir(), 'Library/Application Support/abnerworks.Typora/themes'),
        '/Applications/Typora.app/Contents/Resources/TypeMark/style/themes',
    ];
    for (const c of candidates) if (fs.existsSync(c)) return c;
    return null;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ===================== Pandoc =====================
function runPandoc(inputFile, outputHtml, opts) {
    return new Promise((resolve, reject) => {
        const exts = [
            'pipe_tables','tex_math_dollars','task_lists','footnotes',
            'definition_lists','smart','autolink_bare_uris','strikeout',
            'yaml_metadata_block','implicit_figures','table_captions',
            'header_attributes','fenced_divs','line_blocks','subscript',
            'superscript','grid_tables','multiline_tables','raw_html',
            'markdown_in_html_blocks','tex_math_single_backslash',
            'emoji','hard_line_breaks'
        ].join('+');

        const args = [
            inputFile,
            '-f', `markdown+${exts}`,
            '-t', 'html5',
            '--standalone',
            '--template', opts.template,
            '-o', outputHtml,
        ];

        if (opts.css) args.push('--css', opts.css);
        if (opts.toc) {
            args.push('--toc');
            args.push('--toc-depth', String(opts.tocDepth || 3));
        } else {
            args.push('--toc=false');
        }
        if (opts.katex) args.push('--katex');
        else if (opts.mathjax) args.push('--mathjax');

        // Syntax highlighting
        args.push('--syntax-highlighting', opts.highlightStyle || 'tango');

        const proc = spawn('pandoc', args, { stdio: ['ignore', 'inherit', 'inherit'] });
        proc.on('close', code => code === 0 ? resolve() : reject(new Error(`Pandoc exited ${code}`)));
    });
}

// ===================== HTML Post-processing =====================
function injectMermaidSupport(htmlFile) {
    let html = fs.readFileSync(htmlFile, 'utf8');
    const mermaidScript = `
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
  mermaid.initialize({ startOnLoad: true, theme: 'default' });
</script>`;
    if (html.includes('class="mermaid"') || html.includes('```mermaid')) {
        // Pandoc may not add mermaid class; we add a small script to convert code blocks
        const converter = `
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
  mermaid.initialize({ startOnLoad: false, theme: 'default' });
  document.querySelectorAll('pre > code.language-mermaid').forEach(block => {
    const pre = block.parentElement;
    const div = document.createElement('div');
    div.className = 'mermaid';
    div.textContent = block.textContent;
    pre.replaceWith(div);
  });
  await mermaid.run();
</script>`;
        html = html.replace('</body>', converter + '\n</body>');
        fs.writeFileSync(htmlFile, html);
    }
}

// ===================== PDF =====================
async function htmlToPdf(htmlFile, pdfFile, opts) {
    const chromePath = findChrome();
    const puppeteerInfo = findPuppeteer();

    if (puppeteerInfo && chromePath) {
        console.log('[md2pdf] Using Puppeteer + Chrome for PDF generation');
        const browser = await puppeteerInfo.mod.launch({
            headless: true,
            executablePath: chromePath,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
        });
        const page = await browser.newPage();
        await page.goto('file://' + htmlFile, { waitUntil: 'networkidle0' });
        // Wait for Mermaid and KaTeX
        await sleep(2000);
        await page.pdf({
            path: pdfFile,
            format: opts.pageSize || 'A4',
            printBackground: true,
            margin: {
                top: opts.marginTop || '20mm',
                right: opts.marginRight || '20mm',
                bottom: opts.marginBottom || '20mm',
                left: opts.marginLeft || '20mm',
            },
        });
        await browser.close();
    } else if (chromePath) {
        console.log('[md2pdf] Using Chrome headless CLI for PDF generation');
        console.log('[md2pdf] Note: Install puppeteer for better Mermaid/math support: npm install -g puppeteer');
        const args = [
            '--headless',
            '--disable-gpu',
            '--no-sandbox',
            `--print-to-pdf=${pdfFile}`,
            '--print-to-pdf-no-header',
            '--run-all-compositor-stages-before-draw',
            htmlFile,
        ];
        await new Promise((resolve, reject) => {
            const proc = spawn(chromePath, args, { stdio: ['ignore', 'inherit', 'inherit'] });
            proc.on('close', code => {
                if (code === 0 && fs.existsSync(pdfFile)) resolve();
                else reject(new Error(`Chrome exited ${code}`));
            });
        });
    } else {
        throw new Error('Google Chrome / Chromium not found. Install Chrome to proceed.');
    }
}

// ===================== CLI =====================
function parseArgs(argv) {
    const opts = { katex: true, toc: false, tocDepth: 3, pageSize: 'A4', theme: 'github' };
    const positional = [];
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--toc') opts.toc = true;
        else if (a === '--no-toc') opts.toc = false;
        else if (a === '--mathjax') { opts.mathjax = true; opts.katex = false; }
        else if (a === '--katex') { opts.katex = true; opts.mathjax = false; }
        else if (a === '--theme' && i + 1 < argv.length) opts.theme = argv[++i];
        else if (a === '--page-size' && i + 1 < argv.length) opts.pageSize = argv[++i];
        else if (a === '--margin' && i + 1 < argv.length) {
            const m = argv[++i];
            opts.marginTop = opts.marginRight = opts.marginBottom = opts.marginLeft = m;
        }
        else if (a.startsWith('--margin-') && i + 1 < argv.length) {
            const side = a.replace('--margin-', '');
            opts[`margin${side.charAt(0).toUpperCase() + side.slice(1)}`] = argv[++i];
        }
        else if (a === '--highlight-style' && i + 1 < argv.length) opts.highlightStyle = argv[++i];
        else if (!a.startsWith('-')) positional.push(a);
        else if (a === '-h' || a === '--help') opts.help = true;
    }
    return { opts, positional };
}

function showHelp() {
    console.log(`Usage: md2pdf.js <input.md> [output.pdf] [options]

Options:
  --theme <name>          Theme name: github, newsprint, night, gothic, pixyll, auto (default: github)
  --toc                   Include table of contents
  --toc-depth <n>         TOC depth (default: 3)
  --katex                 Use KaTeX for math (default)
  --mathjax               Use MathJax for math
  --page-size <size>      A4, Letter, etc. (default: A4)
  --margin <val>          Set all margins (default: 20mm)
  --margin-top <val>      Top margin
  --margin-right <val>    Right margin
  --margin-bottom <val>   Bottom margin
  --margin-left <val>     Left margin
  --highlight-style <s>   Pandoc highlight style: tango, pygments, kate, etc.
  -h, --help              Show this help
`);
}

// ===================== Theme Resolution =====================
function resolveTheme(themeName, assetsDir) {
    if (themeName === 'auto') {
        const typoraDir = findTyporaThemes();
        if (typoraDir) {
            const cssFile = path.join(typoraDir, 'github.css');
            if (fs.existsSync(cssFile)) return cssFile;
        }
        return path.join(assetsDir, 'github.css');
    }
    // Check built-in
    const builtIn = path.join(assetsDir, `${themeName}.css`);
    if (fs.existsSync(builtIn)) return builtIn;
    // Check Typora themes
    const typoraDir = findTyporaThemes();
    if (typoraDir) {
        const cssFile = path.join(typoraDir, `${themeName}.css`);
        if (fs.existsSync(cssFile)) return cssFile;
    }
    console.warn(`[md2pdf] Theme "${themeName}" not found, falling back to github`);
    return path.join(assetsDir, 'github.css');
}

// ===================== Main =====================
async function main() {
    const { opts, positional } = parseArgs(process.argv.slice(2));
    if (opts.help) { showHelp(); process.exit(0); }
    if (positional.length < 1) { showHelp(); process.exit(1); }

    const inputFile = path.resolve(positional[0]);
    const outputFile = positional[1] ? path.resolve(positional[1]) : inputFile.replace(/\.md$/i, '.pdf');
    if (!fs.existsSync(inputFile)) { console.error('Input not found:', inputFile); process.exit(1); }

    const scriptDir = __dirname;
    const skillDir = path.dirname(scriptDir);
    const assetsDir = path.join(skillDir, 'assets');
    const templateFile = path.join(assetsDir, 'template.html');
    const cssFile = resolveTheme(opts.theme, assetsDir);

    const tmpHtml = path.join(os.tmpdir(), `md2pdf-${Date.now()}.html`);

    console.log('[md2pdf] Input:', inputFile);
    console.log('[md2pdf] Output:', outputFile);
    console.log('[md2pdf] Theme:', cssFile);

    await runPandoc(inputFile, tmpHtml, {
        template: templateFile,
        css: cssFile,
        toc: opts.toc,
        tocDepth: opts.tocDepth,
        katex: opts.katex,
        mathjax: opts.mathjax,
        highlightStyle: opts.highlightStyle,
    });

    injectMermaidSupport(tmpHtml);

    await htmlToPdf(tmpHtml, outputFile, opts);

    fs.unlinkSync(tmpHtml);
    console.log('[md2pdf] Done:', outputFile);
}

main().catch(err => {
    console.error('[md2pdf] Error:', err.message);
    process.exit(1);
});
