from pathlib import Path

text = Path("index.html").read_text(encoding="utf-8", errors="replace").splitlines()
for i in range(790, 870):
    print(f"{i+1:04d}: {text[i]}")
