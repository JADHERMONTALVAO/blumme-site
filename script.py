from pathlib import Path
path = Path('contato.html')
text = path.read_text(encoding='utf-8')
marker = '<div class= via-mobile-menu-overlay id=via-mobile-menu-overlay aria-hidden=true></div>'
pos = text.find(marker)
if pos == -1:
    raise SystemExit('marker not found')
pos += len(marker)
panel_html = \n<div class=\via-mobile-panel\ id=\via-mobile-panel\ aria-hidden=\true\>\n\t<div class=\via-mobile-panel-inner\>\n\t\t<a class=\via-mobile-panel-link\ href=\index.html\>Início</a>\n\t\t<a class=\via-mobile-panel-link\ href=\quem-somos.html\>Quem somos</a>\n\t\t<a class=\via-mobile-panel-link\ href=\contato.html\>Contato</a>\n\t\t<a class=\via-mobile-panel-link\ href=\mensagemacompanhar.html\>Acompanhar projetos</a>\n\t</div>\n\t<button class=\via-mobile-panel-close\ type=\button\>Fechar</button>\n</div>\n
if panel_html in text:
 raise SystemExit('panel already present')
text = text[:pos] + panel_html + text[pos:]
text = text.replace('aria-controls=\via-mobile-menu\', 'aria-controls=\via-mobile-panel\', 1)
path.write_text(text, encoding='utf-8')
