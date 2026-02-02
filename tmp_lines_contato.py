# -*- coding: utf-8 -*-
from pathlib import Path
text = Path('contato.html').read_text(encoding='utf-8')
for idx, line in enumerate(text.splitlines(), 1):
    if idx > 40:
        break
    print(f"{idx}: {line}")
