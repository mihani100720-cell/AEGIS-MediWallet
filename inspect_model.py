import json
import urllib.request
import re

url = "https://huggingface.co/api/models/KushagraWadhwa/medical-prescription-ocr-india"
try:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        print("Model API response:")
        print("id:", data.get("id"))
        print("pipeline_tag:", data.get("pipeline_tag"))
        print("tags:", data.get("tags"))
        print("config:", data.get("config"))
        print("siblings (files):", [s.get("rfilename") for s in data.get("siblings", [])])
        print("cardData:", data.get("cardData"))
except Exception as e:
    print("Error fetching api:", e)

# Also check raw README.md directly
raw_readme_url = "https://huggingface.co/KushagraWadhwa/medical-prescription-ocr-india/raw/main/README.md"
try:
    req = urllib.request.Request(raw_readme_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        readme = resp.read().decode()
        print("\n--- README.md ---")
        print(readme[:3000])
except Exception as e:
    print("Error fetching raw readme:", e)
