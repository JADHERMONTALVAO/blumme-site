from pathlib import Path
text = Path('index.html').read_text(encoding='latin-1')
pos = text.find('via-navbar .via-menu-container')
print(pos)
print(text[pos-60:pos+60])
