from pathlib import Path
text = Path('index.html').read_text(encoding='utf-8')
pos = text.index('aria-controls')
chunk = text[pos-20:pos+80]
print(repr(chunk))
