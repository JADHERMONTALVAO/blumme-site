 = 'index.html'
 = Get-Content -Raw 
 = .IndexOf('<div class= via-navbar-right>')
 = .IndexOf('<h1 class=via-hidden>Blumme</h1>', )
if ( -lt 0 -or  -lt 0) { throw 'markers missing' }
 = .Substring(,  - )
 = '<button class=via-menu-toggle type=button aria-controls=mobile-menu aria-expanded=false><span class=via-menu-icon aria-hidden=true></span>Menu</button>'
 = .Replace('</div></div></div></div></div>', '</div>' +  + '</div></div></div></div></div>', 1)
 = '<div id=mobile-menu class=via-mobile-menu aria-hidden=true>
    <div class=via-mobile-menu-inner>
        <button type=button class=via-mobile-menu-close aria-label=Fechar menu>×</button>
        <a href=quem-somos.html class=via-mobile-menu-link>Quem somos</a>
        <a href=contato.html class=via-mobile-menu-link>Contato</a>
        <a href=cases.html class=via-mobile-menu-link>Cases</a>
        <a href=mensagemacompanhar.html class=via-mobile-menu-link via-mobile-menu-link--primary>Acompanhar projetos</a>
    </div>
</div>
'
 = .Substring(0, ) +  +  + .Substring()
Set-Content -Encoding utf8  
