import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('extracted_blueprint.txt', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('Final folder structure to create in Antigravity')
if pos != -1:
    print(text[pos:pos+3500])
