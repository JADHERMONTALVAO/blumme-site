from pathlib import Path
path = Path('index.html')
text = path.read_text(encoding='utf-8')
old_nav = 'class= via-navbar-nav w-nav-menu'
if old_nav not in text:
    raise SystemExit('nav class not found')
text = text.replace(old_nav, 'class=via-navbar-nav', 1)
old_link = 'class=via-navbar-nav-link w-nav-link'
if old_link not in text:
    raise SystemExit('link class not found')
text = text.replace(old_link, 'class=via-navbar-nav-link')
path.write_text(text, encoding='utf-8')
