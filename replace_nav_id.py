from pathlib import Path
path = Path('index.html')
text = path.read_text(encoding='utf-8')
old = 'nav role= navigation id=via-mobile-menu'
if old not in text:
    raise SystemExit('old not found')
text = text.replace(old, 'nav role=navigation id=via-primary-menu', 1)
path.write_text(text, encoding='utf-8')
