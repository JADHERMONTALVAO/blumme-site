from pathlib import Path
path = Path('index.html')
text = path.read_text(encoding='utf-8', errors='replace')
start = text.find('<div class= via-navbar-right>')
end = text.find('<h1 class=" "via-hidden>Blumme</h1>', start)
if start == -1 or end == -1: raise SystemExit('marker not found')
nav_block = text[start:end]
button_html = '<button class=" "via-menu-toggle type=button aria-controls=mobile-menu aria-expanded=false><span class=via-menu-icon aria-hidden=true></span>Menu</button>'
nav_block = nav_block.replace('</div></div></div></div></div>', '</div>' + button_html + '</div></div></div></div></div>', 1)
