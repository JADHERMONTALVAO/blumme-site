from pathlib import Path
text = Path('index.html').read_text(encoding='utf-8')
pos = text.index('</button></div></div>')
print(text[pos:pos+80])
