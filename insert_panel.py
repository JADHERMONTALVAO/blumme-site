from pathlib import Path
path = Path('index.html')
text = path.read_text(encoding='utf-8')
needle = '</button></div></div>'
idx = text.find(needle)
if idx == -1:
    raise SystemExit('needle not found')
insert_pos = idx + len(needle)
panel = '''
<div class= via-mobile-panel id=via-mobile-panel aria-hidden=true>
  <div class=via-mobile-panel-inner>
    <a class=via-mobile-panel-link href=index.html>Início</a>
    <a class=via-mobile-panel-link href=quem-somos.html>Quem somos</a>
    <a class=via-mobile-panel-link href=contato.html>Contato</a>
    <a class=via-mobile-panel-link href=mensagemacompanhar.html>Acompanhar projetos</a>
  </div>
  <button type=button class=via-mobile-panel-close aria-label=Fechar menu mobile>Fechar</button>
</div>'''
text = text[:insert_pos] + panel + text[insert_pos:]
path.write_text(text, encoding='utf-8')
