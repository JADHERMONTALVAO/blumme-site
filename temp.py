from pathlib import Path
text=Path('index.html').read_text(encoding='utf-8', errors='replace')
start=text.find('via-navbar w-nav')
print('start', start)
print(text[start:start+1200])
