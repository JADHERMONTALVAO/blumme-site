 = 'index.html'
 = Get-Content  -Raw
 = 'nav role= navigation id=via-mobile-menu'
 = .IndexOf()
if ( -lt 0) { throw 'old not found' }
 = .Substring(0, ) + 'nav role=navigation id=via-primary-menu' + .Substring( + .Length)
Set-Content -Path  -Value  -Encoding utf8
