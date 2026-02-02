from pathlib import Path
text = Path('index.html').read_text(encoding='utf-8')
start = text.index('Acompanhar projetos')
end = text.index('<h1 class="via-hidden"')
print(text[start-50:end+30])
