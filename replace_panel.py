from pathlib import Path
path = Path('contato.html')
text = path.read_text(encoding='utf-8')
marker = '</button></div></div><h1 class= via-hidden>Blumme Engenharia'
replacement = '</button></div></div>\n<div class= via-mobile-panel id=via-mobile-panel aria-hidden=true>\n  <div class=via-mobile-panel-inner>\n    <a class=via-mobile-panel-link href=index.html>Início</a>\n    <a class=via-mobile-panel-link href=quem-somos.html>Quem somos</a>\n    <a class=via-mobile-panel-link href=contato.html>Contato</a>\n    <a class=via-mobile-panel-link href=mensagemacompanhar.html>Acompanhar projetos</a>\n  </div>\n  <button type=button class=via-mobile-panel-close aria-label=Fechar menu mobile>Fechar</button>\n</div><h1 class=\via-hidden\>Blumme Engenharia'
if marker not in text:
    raise SystemExit('marker not found')
path.write_text(text.replace(marker, replacement, 1), encoding='utf-8')
