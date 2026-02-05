from pathlib import Path
text = Path('index.html').read_text(encoding='utf-8')
pos = text.index('nav role')
chunk = text[pos:pos+60]
print(chunk)
print(list(chunk))
