from pathlib import Path
text = Path('index.html').read_text(encoding='utf-8')
needle = '</button></div></div><h1'
print(text.find(needle))
