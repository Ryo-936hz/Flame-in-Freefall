param([ValidateRange(1024,65535)][int]$Port = 8000)
. (Join-Path $PSScriptRoot 'common.ps1')
Push-Location -LiteralPath $script:FlameLabRoot
try { Invoke-Checked (Get-ProjectPython) @('-m','uvicorn','flamelab.main:app','--host','127.0.0.1','--port',"$Port") }
finally { Pop-Location }
