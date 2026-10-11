import sys

with open('extracted_blueprint.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's inspect "Recommended tech stack"
pos = text.find('Recommended tech stack')
if pos != -1:
    print(text[pos:pos+4000])

print("\n--- ARCHITECTURE ---")
pos2 = text.find('Final Aegis Care architecture')
if pos2 != -1:
    print(text[pos2:pos2+3000])
