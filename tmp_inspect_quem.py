# -*- coding: utf-8 -*-
from pathlib import Path
text = Path('quem-somos.html').read_text(encoding='latin-1')
idx = text.index('<h1 class="via-hidden"')
print(text[idx-80:idx+40])
