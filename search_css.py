from pathlib import Path
import re
text = Path('index.html').read_text(encoding='latin-1')
match = re.search(r'\.via-navbar\.\s*via-navbar-nav-right\s*{', text)
print('found' if match else 'not found')
if match:
    start = match.start()
    print(text[start-50:start+80])
