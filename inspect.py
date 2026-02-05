from pathlib import Path
text = Path('index.html').read_text(encoding='latin-1')
idx = text.find('.via-navbar .via-navbar-nav')
print('idx', idx)
print(text[idx-20:idx+40])
