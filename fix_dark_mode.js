const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

const dir = path.join(__dirname, 'src');

walkDir(dir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace background colors
    content = content.replace(/bg-white dark:bg-slate-900/g, 'bg-card text-card-foreground');
    content = content.replace(/bg-white dark:bg-slate-950/g, 'bg-card text-card-foreground');
    content = content.replace(/bg-slate-50 dark:bg-slate-900\/50/g, 'bg-muted/50');
    content = content.replace(/bg-slate-100 dark:bg-slate-800/g, 'bg-muted');
    
    // Replace borders
    content = content.replace(/border-slate-200 dark:border-slate-800/g, 'border-border');
    content = content.replace(/border-slate-300 dark:border-slate-700/g, 'border-border');
    content = content.replace(/border-blue-100 dark:border-blue-900\/50/g, 'border-border');
    
    // Replace texts
    content = content.replace(/text-slate-900 dark:text-slate-100/g, 'text-foreground');
    content = content.replace(/text-slate-800 dark:text-slate-200/g, 'text-foreground');
    content = content.replace(/text-slate-700 dark:text-slate-300/g, 'text-muted-foreground');
    content = content.replace(/text-slate-600 dark:text-slate-400/g, 'text-muted-foreground');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
