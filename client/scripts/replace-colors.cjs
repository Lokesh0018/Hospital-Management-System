const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '..', 'src', 'styles');

const replacements = [
  // Backgrounds
  { regex: /background:\s*#ffffff;/g, replacement: 'background: var(--surface);' },
  { regex: /background:\s*white;/g, replacement: 'background: var(--surface);' },
  { regex: /background-color:\s*#ffffff;/g, replacement: 'background-color: var(--surface);' },
  { regex: /background-color:\s*white;/g, replacement: 'background-color: var(--surface);' },
  { regex: /background:\s*var\(--color-slate-50\);/g, replacement: 'background: var(--surface-alt);' },
  { regex: /background-color:\s*var\(--color-slate-50\);/g, replacement: 'background-color: var(--surface-alt);' },
  { regex: /background:\s*var\(--color-slate-100\);/g, replacement: 'background: var(--bg-hover);' },
  { regex: /background:\s*#fafafa;/g, replacement: 'background: var(--surface-alt);' },
  
  // Text Colors
  { regex: /color:\s*var\(--color-slate-900\);/g, replacement: 'color: var(--text-primary);' },
  { regex: /color:\s*var\(--color-slate-800\);/g, replacement: 'color: var(--text-primary);' },
  { regex: /color:\s*var\(--color-slate-700\);/g, replacement: 'color: var(--text-secondary);' },
  { regex: /color:\s*var\(--color-slate-600\);/g, replacement: 'color: var(--text-secondary);' },
  { regex: /color:\s*var\(--color-slate-500\);/g, replacement: 'color: var(--text-secondary);' },
  { regex: /color:\s*#000000;/g, replacement: 'color: var(--text-primary);' },
  { regex: /color:\s*black;/g, replacement: 'color: var(--text-primary);' },
  
  // Borders
  { regex: /border-color:\s*var\(--color-slate-200\);/g, replacement: 'border-color: var(--border);' },
  { regex: /border-color:\s*var\(--color-slate-300\);/g, replacement: 'border-color: var(--border);' },
  { regex: /border-color:\s*var\(--color-slate-100\);/g, replacement: 'border-color: var(--border);' },
  { regex: /border:\s*1px\s*solid\s*var\(--color-slate-100\);/g, replacement: 'border: 1px solid var(--border);' },
  { regex: /border-bottom:\s*1px\s*solid\s*var\(--color-slate-100\);/g, replacement: 'border-bottom: 1px solid var(--border);' },
  { regex: /border-top:\s*1px\s*solid\s*var\(--color-slate-100\);/g, replacement: 'border-top: 1px solid var(--border);' },
  { regex: /border:\s*1\.5px\s*solid\s*var\(--color-slate-200\);/g, replacement: 'border: 1.5px solid var(--border);' },
  { regex: /border:\s*1px\s*solid\s*#ddd;/g, replacement: 'border: 1px solid var(--border);' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${path.basename(filePath)}`);
  }
}

fs.readdirSync(cssDir).forEach(file => {
  if (file.endsWith('.css')) {
    processFile(path.join(cssDir, file));
  }
});

console.log('CSS replacement complete.');
