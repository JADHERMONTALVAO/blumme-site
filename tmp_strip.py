from pathlib import Path
path = Path('contato.html')
data = path.read_text(encoding='utf-8')
start = data.find('<style>\r\n.via-mobile-menu-toggle')
if start == -1:
    start = data.find('<style>\n.via-mobile-menu-toggle')
if start == -1:
    raise SystemExit('style block not found')
end = data.find('</style>', start) + len('</style>')
data = data[:start] + data[end:]
start_script = data.find('\n(function () {\r\n\tvar nav = document.getElementById( via-mobile-menu)')
if start_script == -1:
    start_script = data.find('\n(function () {\n\tvar nav = document.getElementById(via-mobile-menu)')
if start_script == -1:
    raise SystemExit('nav script not found')
start_script = data.rfind('<script>', 0, start_script)
end_script = data.find('</script>', start_script) + len('</script>')
data = data[:start_script] + data[end_script:]
path.write_text(data, encoding='utf-8')
