from pathlib import Path
text = Path('index.html').read_text(encoding='utf-8')
pos = text.index('nav role')
chunk = text[pos:pos+50]
print(chunk.encode('utf-8'))
