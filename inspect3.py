from pathlib import Path
text = Path('index.html').read_text(encoding='latin-1')
pos = text.index('.via-navbar .via-menu-container')
print(text[pos:pos+200])
print('-----')
end = text.index('@media (max-width: 991px)', pos)
print(text[pos:end])
