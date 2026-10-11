import re, sys

with open('scratch_gommr.css', 'r', encoding='utf-8') as f:
    css = f.read()

print('CSS length:', len(css))
fonts = set(re.findall(r'font-family:[^;]+;', css))
print('Fonts found:', fonts)

# Look for CSS variables or primary colors
vars_found = re.findall(r'--[a-zA-Z0-9_-]+:\s*[^;]+;', css)
print('Sample CSS variables (first 15):')
for v in vars_found[:15]:
    print(' ', v)

with open('scratch_gommr.js', 'r', encoding='utf-8') as f:
    js = f.read()
print('JS bundle length:', len(js))

keywords = ['medical', 'record', 'timeline', 'doctor', 'privacy', 'care', 'emergency', 'scan', 'smart']
matches = []
for m in re.finditer(r'"([^"\\]{8,90})"', js):
    txt = m.group(1)
    if any(k in txt.lower() for k in keywords):
        matches.append(txt)

print('Sample key phrases from gommr.in:')
for s in matches[:30]:
    print(' -', s)
