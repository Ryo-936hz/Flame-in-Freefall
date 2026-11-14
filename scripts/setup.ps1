param([string]$Python = '', [string]$Uv = '')
. (Join-Path $PSScriptRoot 'common.ps1')
Push-Location -LiteralPath $script:FlameLabRoot
try {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js >=22.12 (including npm).' }
    Invoke-Checked 'node' @('-e', 'const [a,b]=process.versions.node.split(".").map(Number); if(a<22||(a===22&&b<12))process.exit(1)')
    if (-not $Python) {
        $bundled = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
        if (Test-Path -LiteralPath $bundled) { $Python = $bundled }
        elseif (Get-Command python -ErrorAction SilentlyContinue) { $Python = (Get-Command python).Source }
        else { throw 'Install Python 3.12 or provide -Python with its executable path.' }
    }
    Invoke-Checked $Python @('-c', 'import sys; assert (3,12)<=sys.version_info[:2]<(3,14), "Python 3.12 or 3.13 required"')
    if (-not $Uv) {
        if (Get-Command uv -ErrorAction SilentlyContinue) { $Uv = (Get-Command uv).Source }
        else {
            $Uv = Join-Path $script:FlameLabRoot 'work/tooling/bin/uv.exe'
            if (-not (Test-Path -LiteralPath $Uv)) {
                Invoke-Checked $Python @('-m', 'pip', 'install', '--target', 'work/tooling', 'uv==0.9.5')
            }
        }
    }
    Invoke-Checked $Uv @('sync', '--locked', '--python', $Python)
    if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue) -and -not (Test-Path -LiteralPath 'work/npm-tooling/node_modules/npm/bin/npm-cli.js')) {
        $pnpm = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm.cmd'
        if (-not (Test-Path -LiteralPath $pnpm)) { throw 'Install Node.js including npm, then rerun setup.' }
        New-Item -ItemType Directory -Force -Path 'work/npm-tooling' | Out-Null
        if (-not (Test-Path -LiteralPath 'work/npm-tooling/package.json')) {
            Set-Content -LiteralPath 'work/npm-tooling/package.json' -Value '{"private":true}' -Encoding utf8
        }
        Invoke-Checked $pnpm @('--dir', 'work/npm-tooling', 'add', '--save-exact', 'npm@11.6.2')
    }
    Invoke-ProjectNpm @('ci', '--ignore-scripts')
    if (-not (Test-Path -LiteralPath '.env')) { Copy-Item -LiteralPath '.env.example' -Destination '.env' }
    Invoke-Checked (Get-ProjectPython) @('scripts/export-openapi.py', '--check')
    Invoke-ProjectNpm @('run', 'check:types')
    Invoke-ProjectNpm @('run', 'typecheck')
    Invoke-ProjectNpm @('run', 'build')
    Write-Output 'Setup complete. Run scripts/dev-api.ps1 and scripts/dev-web.ps1 in separate terminals.'
} finally { Pop-Location }
