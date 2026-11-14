. (Join-Path $PSScriptRoot 'common.ps1')
Push-Location -LiteralPath $script:FlameLabRoot
try { Invoke-ProjectNpm @('run','dev:web','--','--host','127.0.0.1') }
finally { Pop-Location }
