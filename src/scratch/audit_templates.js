const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '../templates');
const templates = fs.readdirSync(templatesDir).filter(f => fs.statSync(path.join(templatesDir, f)).isDirectory());

const report = [];

for (const t of templates) {
  const tPath = path.join(templatesDir, t);
  const htmlPath = path.join(tPath, 'index.html');
  const cssPath = path.join(tPath, 'style.css');
  const jsPath = path.join(tPath, 'script.js');

  const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';
  const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
  const js = fs.existsSync(jsPath) ? fs.readFileSync(jsPath, 'utf8') : '';

  const issues = [];

  // --- HTML Audits ---
  if (!html) {
    issues.push({
      severity: 'Critical',
      file: 'index.html',
      cause: 'HTML file is missing or empty',
      fix: 'Create a semantic index.html file for the template.'
    });
    continue;
  }

  // Check for viewport meta tag
  if (!html.includes('<meta name="viewport"')) {
    issues.push({
      severity: 'High',
      file: 'index.html',
      cause: 'Missing viewport meta tag for responsive styling',
      fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> to <head>.'
    });
  }

  // Check for stylesheet link
  if (!html.match(/<link[^>]*href=["']style\.css["'][^>]*>/i) && !html.includes('</head>')) {
    issues.push({
      severity: 'Medium',
      file: 'index.html',
      cause: 'No standard style.css link or head tag found',
      fix: 'Ensure <link rel="stylesheet" href="style.css"> is present.'
    });
  }

  // Check for alt tags on img
  const imgTags = html.match(/<img[^>]*>/g) || [];
  for (const img of imgTags) {
    if (!img.includes('alt=')) {
      issues.push({
        severity: 'Medium',
        file: 'index.html',
        cause: `Image tag missing alt attribute: ${img}`,
        fix: 'Add a descriptive alt attribute (e.g., alt="{{personal.fullName}}" or alt="project image").'
      });
    }
  }

  // Check dynamic template loops
  const essentialLoops = ['projects', 'skills', 'experience'];
  for (const loop of essentialLoops) {
    const startPattern = new RegExp(`\\{\\{#${loop}\\}\\}`, 'i');
    const endPattern = new RegExp(`\\{\\{\\/${loop}\\}\\}`, 'i');
    if (!startPattern.test(html) || !endPattern.test(html)) {
      issues.push({
        severity: 'High',
        file: 'index.html',
        cause: `Missing loop compiler tags for dynamic collection: {{#${loop}}}...{{/${loop}}}`,
        fix: `Implement dynamic array loops to display user-provided ${loop}.`
      });
    }
  }

  // Check for hardcoded profile name/bio (stale data)
  const names = ['john doe', 'jane doe', 'sigma developer', 'aether premium'];
  for (const name of names) {
    if (html.toLowerCase().includes(name)) {
      issues.push({
        severity: 'Medium',
        file: 'index.html',
        cause: `Contains hardcoded fallback name or placeholder: "${name}"`,
        fix: 'Ensure all personal data uses placeholders (e.g., {{personal.fullName}}).'
      });
    }
  }

  // Check for body class/attributes for responsiveness and dynamic themes
  if (t.startsWith('aether-') && !html.includes('data-type=')) {
    issues.push({
      severity: 'Medium',
      file: 'index.html',
      cause: 'Aether templates must use data-type attribute on body to style dynamically',
      fix: 'Add data-type="{{portfolioType}}" or data-type="<Type>" to the body element.'
    });
  }

  // --- CSS Audits ---
  if (!css) {
    issues.push({
      severity: 'High',
      file: 'style.css',
      cause: 'CSS file is missing or empty',
      fix: 'Create a style.css file for this template.'
    });
  } else {
    // Check for hardcoded width causing overflow
    const hardcodedWidths = css.match(/[^\-\w](width|min-width):\s*\d{3,}px/g) || [];
    for (const w of hardcodedWidths) {
      if (!w.includes('100%') && !w.includes('max-width')) {
        issues.push({
          severity: 'High',
          file: 'style.css',
          cause: `Hardcoded pixel width container property found: "${w}"`,
          fix: 'Replace with max-width or percentage/viewport units (e.g., max-width: 1200px or width: 100%).'
        });
      }
    }

    // Check for responsiveness (media queries)
    if (!css.includes('@media')) {
      issues.push({
        severity: 'High',
        file: 'style.css',
        cause: 'No @media queries found (completely non-responsive)',
        fix: 'Add media queries for mobile viewport breakpoints (e.g., @media (max-width: 768px)).'
      });
    }

    // Check for outline: none without focus
    if (css.includes('outline: none') && !css.includes(':focus')) {
      issues.push({
        severity: 'Low',
        file: 'style.css',
        cause: 'outline: none used without visible :focus outline state definitions',
        fix: 'Provide a visible focus state for keyboard accessibility.'
      });
    }

    // Check for layout breaking flex/grid containers
    if (css.includes('display: flex') && !css.includes('flex-wrap') && !css.includes('flex-direction: column')) {
      issues.push({
        severity: 'Medium',
        file: 'style.css',
        cause: 'Flex container lacks flex-wrap, risking horizontal overflow on narrow screens',
        fix: 'Add flex-wrap: wrap; to flex layouts that contain multi-item lists.'
      });
    }

    // Check for broken box-sizing
    if (!css.includes('box-sizing: border-box') && !css.includes('box-sizing:border-box')) {
      issues.push({
        severity: 'Medium',
        file: 'style.css',
        cause: 'Universal box-sizing: border-box is not set, which often breaks width/padding calculations',
        fix: 'Add *, *::before, *::after { box-sizing: border-box; } to CSS resets.'
      });
    }
  }

  // --- JS Audits ---
  if (js && js.includes('document.write')) {
    issues.push({
      severity: 'High',
      file: 'script.js',
      cause: 'Uses document.write which breaks rendering workflows',
      fix: 'Use DOM manipulation instead (e.g., document.createElement, appendChild).'
    });
  }

  report.push({
    template: t,
    issues
  });
}

// Generate markdown report
let md = '# Template Audit Results\n\n';
let totalIssues = 0;

for (const t of report) {
  md += `## Template: ${t.template}\n\n`;
  if (t.issues.length === 0) {
    md += '✅ No issues found.\n\n';
  } else {
    md += '| Severity | File | Cause | Recommended Fix |\n';
    md += '|---|---|---|---|\n';
    for (const issue of t.issues) {
      md += `| **${issue.severity}** | \`${issue.file}\` | ${issue.cause} | ${issue.fix} |\n`;
      totalIssues++;
    }
    md += '\n';
  }
}

md += `### Summary\n- Total templates audited: ${templates.length}\n- Total issues found: ${totalIssues}\n`;

fs.writeFileSync(path.join(__dirname, 'audit_report.md'), md, 'utf8');
console.log('Audit completed. Report generated at audit_report.md');
console.log(`Found ${totalIssues} issues across ${templates.length} templates.`);
