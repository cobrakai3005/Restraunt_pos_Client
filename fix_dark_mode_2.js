const fs = require('fs');
const path = require('path');

function processFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    const original = content;

    content = content.replace(/\btext-slate-900(?![/\w-])(?!\s+dark:text-slate-)/g, 'text-slate-900 dark:text-slate-100');
    content = content.replace(/\bborder-purple-100(?![/\w-])(?!\s+dark:border-purple-)/g, 'border-purple-100 dark:border-purple-900/50');
    content = content.replace(/\bbg-purple-100(?![/\w-])(?!\s+dark:bg-purple-)/g, 'bg-purple-100 dark:bg-purple-900/30');
    content = content.replace(/\bbg-purple-50(?![/\w-])(?!\s+dark:bg-purple-)/g, 'bg-purple-50 dark:bg-purple-900/20');
    content = content.replace(/\bbg-blue-50(?![/\w-])(?!\s+dark:bg-blue-)/g, 'bg-blue-50 dark:bg-blue-900/20');
    content = content.replace(/\bbg-blue-100(?![/\w-])(?!\s+dark:bg-blue-)/g, 'bg-blue-100 dark:bg-blue-900/40');
    content = content.replace(/\bborder-blue-200(?![/\w-])(?!\s+dark:border-blue-)/g, 'border-blue-200 dark:border-blue-800');
    content = content.replace(/\bborder-slate-300(?![/\w-])(?!\s+dark:border-slate-)/g, 'border-slate-300 dark:border-slate-700');
    content = content.replace(/\bborder-dashed border-slate-200(?![/\w-])(?!\s+dark:border-slate-)/g, 'border-dashed border-slate-200 dark:border-slate-700');

    if (content !== original) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`Updated ${filepath}`);
    }
}

function walkSync(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            walkSync(filepath);
        } else if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
            processFile(filepath);
        }
    }
}

walkSync('src');
