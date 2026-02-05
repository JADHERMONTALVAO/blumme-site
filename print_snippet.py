from pathlib import Path
text = Path('index.html').read_text(encoding='utf-8')
pos = text.index('nav role')
print(repr(text[pos-10:pos+80]))
