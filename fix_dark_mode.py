import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Replace bg-white with bg-white dark:bg-slate-900
    content = re.sub(r'\bbg-white(?![/\w-])(?!\s+dark:bg-slate-)', 'bg-white dark:bg-slate-900', content)
    
    # Replace bg-slate-50 with dark:bg-slate-800/50
    content = re.sub(r'\bbg-slate-50(?![/\w-])(?!\s+dark:bg-slate-)', 'bg-slate-50 dark:bg-slate-800/50', content)

    # Replace border-slate-200 with dark:border-slate-800
    content = re.sub(r'\bborder-slate-200(?![/\w-])(?!\s+dark:border-slate-)', 'border-slate-200 dark:border-slate-800', content)

    # Replace border-slate-100 with dark:border-slate-800
    content = re.sub(r'\bborder-slate-100(?![/\w-])(?!\s+dark:border-slate-)', 'border-slate-100 dark:border-slate-800', content)
    
    # Replace border-blue-100 with dark:border-blue-900/50
    content = re.sub(r'\bborder-blue-100(?![/\w-])(?!\s+dark:border-blue-)', 'border-blue-100 dark:border-blue-900/50', content)

    # Replace border-slate-300 with dark:border-slate-700
    content = re.sub(r'\bborder-slate-300(?![/\w-])(?!\s+dark:border-slate-)', 'border-slate-300 dark:border-slate-700', content)
    
    # text-slate-800 to dark:text-slate-100
    content = re.sub(r'\btext-slate-800(?![/\w-])(?!\s+dark:text-slate-)', 'text-slate-800 dark:text-slate-100', content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

def main():
    for root, dirs, files in os.walk('src'):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                process_file(os.path.join(root, file))

if __name__ == '__main__':
    main()
