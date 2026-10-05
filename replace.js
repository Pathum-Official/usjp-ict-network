const fs = require('fs');
const path = require('path');

const directory = 'c:/Project/pmt-family/src';

const replacements = [
  { from: /PMT Family/g, to: 'ICT Network' },
  { from: /PMT Scholars/g, to: 'ICT Scholars' },
  { from: /PMT Portal/g, to: 'ICT Portal' },
  { from: /PMT 2022/g, to: 'ICT 2022' },
  { from: /PMT 2023/g, to: 'ICT 2023' },
  { from: /PMT 2024/g, to: 'ICT 2024' },
  { from: /PMT 2025/g, to: 'ICT 2025' },
  { from: /PMT 2026/g, to: 'ICT 2026' },
  { from: /pmt-2022/g, to: 'ict-2022' },
  { from: /pmt-2023/g, to: 'ict-2023' },
  { from: /pmt-2024/g, to: 'ict-2024' },
  { from: /pmt-2025/g, to: 'ict-2025' },
  { from: /pmt-2026/g, to: 'ict-2026' },
  { from: /PMT/g, to: 'ICT' },
  { from: /pmt/g, to: 'ict' }
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      results.push(file);
    }
  });
  return results;
}

const files = walk(directory);

files.forEach(file => {
  if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.svg') || file.endsWith('.css')) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // special cases first to avoid double replacement
    replacements.forEach(r => {
      content = content.replace(r.from, r.to);
    });
    
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
});
