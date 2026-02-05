from pathlib import Path
path = Path('index.html')
text = path.read_text(encoding='utf-8')
marker = '<div class= via-mobile-menu-overlay id=via-mobile-menu-overlay aria-hidden=true></div>'
pos = text.find(marker)
if pos == -1:
    raise SystemExit('marker not found')
pos += len(marker)
panel_html = <div class=via-mobile-panel id=via-mobile-panel aria-hidden=true>\n\t<div class=via-mobile-panel-content>\n\t\t<nav>\n\t\t\t<a href=index.html class=via-mobile-panel-link>Início</a>\n\t\t\t<a href=quem-somos.html class=via-mobile-panel-link>Quem somos</a>\n\t\t\t<a href=contato.html class=via-mobile-panel-link>Contato</a>\n\t\t\t<a href=mensagemacompanhar.html class=via-mobile-panel-link>Acompanhar projetos</a>\n\t\t</nav>\n\t\t<button class=via-mobile-panel-close type=button>Fechar</button>\n\t</div>\n</div>
if panel_html in text:
    raise SystemExit('panel already present')
text = text[:pos] + panel_html + text[pos:]
text = text.replace('aria-controls=via-mobile-menu', 'aria-controls=via-mobile-panel', 1)
path.write_text(text, encoding='utf-8')
