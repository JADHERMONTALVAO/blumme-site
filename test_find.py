from pathlib import Path
text = Path('index.html').read_text(encoding='utf-8')
print(text.find('nav role= navigation id=via-mobile-menu class'))
