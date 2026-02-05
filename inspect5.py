from pathlib import Path
text = Path('index.html').read_text(encoding='latin-1')
for idx in range(len(text)):
    if text.startswith('.via-navbar-nav {', idx):
        print('found at', idx)
        print(repr(text[idx-30:idx+30]))
        break
else:
    print('not found')
