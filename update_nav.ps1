 = Get-Content index.html -Raw
 =  -replace " class=\via-navbar-nav w-nav-menu\\, \class=\via-navbar-nav\\
 = -replace \class=\via-navbar-nav-link w-nav-link\\, \class=\via-navbar-nav-link\\
Set-Content index.html -Value -Encoding UTF8
