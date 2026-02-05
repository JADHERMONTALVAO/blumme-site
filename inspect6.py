from pathlib import Path
text = Path('index.html').read_text(encoding='latin-1')
import re
for match in re.finditer(r'via-navbar-nav', text):
    start = max(0, match.start()-30)
    end = min(len(text), match.end()+30)
    snippet = text[start:end]
    if '\n' in snippet:
        snippet = snippet.replace('\n', '\\n')
    print('---')
    print(snippet)
