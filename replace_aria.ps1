 = 'index.html'
 = Get-Content  -Raw
 = [regex]::Escape('aria-controls= via-mobile-menu')
 = [regex]::Replace(, , 'aria-controls=via-mobile-panel', 1)
Set-Content -Path  -Value  -Encoding utf8
