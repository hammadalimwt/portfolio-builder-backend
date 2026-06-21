const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '../templates');
const sourceCssPath = path.join(templatesDir, 'aether-tech-premium', 'style.css');

if (!fs.existsSync(sourceCssPath)) {
  console.error('Source style.css not found!');
  process.exit(1);
}

const cssContent = fs.readFileSync(sourceCssPath, 'utf8');

const targets = [
  'aether-business',
  'aether-designer',
  'aether-developer',
  'aether-freelancer',
  'aether-student'
];

for (const target of targets) {
  const targetCssPath = path.join(templatesDir, target, 'style.css');
  if (fs.existsSync(path.dirname(targetCssPath))) {
    fs.writeFileSync(targetCssPath, cssContent, 'utf8');
    console.log(`Propagated CSS to ${target}`);
  } else {
    console.warn(`Target folder ${target} does not exist.`);
  }
}

console.log('CSS propagation complete.');
