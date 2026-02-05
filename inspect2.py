from pathlib import Path
text = Path('index.html').read_text(encoding='latin-1')
pos = text.index('.via-navbar')
print(repr(text[pos:pos+60]))
