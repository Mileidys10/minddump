param(
    [string] = 'tu-subdominio',
    [string] = 'tu-token-duckdns'
)

if ( -eq 'tu-subdominio' -or  -eq 'tu-token-duckdns') {
    Write-Host 'Por favor ingresa tu Dominio y Token de DuckDNS.' -ForegroundColor Yellow
    Write-Host 'Ejemplo: .\actualizar_duckdns.ps1 -Dominio miminddump -Token 12345-6789'
    exit 1
}

Write-Host ('Actualizando DuckDNS para ' +  + '.duckdns.org...') -ForegroundColor Cyan
 = 'https://www.duckdns.org/update?domains=' +  + '&token=' +  + '&ip='
 = Invoke-RestMethod -Uri 
if ( -eq 'OK') {
    Write-Host ('DuckDNS actualizado con exito: ' + ) -ForegroundColor Green
} else {
    Write-Host ('Respuesta de DuckDNS: ' +  + ' (verifica tu token y dominio)') -ForegroundColor Red
}
