$ErrorActionPreference = 'Stop'
$script:FlameLabRoot = Split-Path -Parent $PSScriptRoot

function Invoke-Checked {
    param([string]$Executable, [Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments)
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Command failed ($LASTEXITCODE): $Executable" }
}

function Invoke-ProjectNpm {
    param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments)
    $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if ($npmCommand) { Invoke-Checked $npmCommand.Source $Arguments; return }
    $localNpm = Join-Path $script:FlameLabRoot 'work/npm-tooling/node_modules/npm/bin/npm-cli.js'
    if (-not (Test-Path -LiteralPath $localNpm)) { throw 'npm not found. Run scripts/setup.ps1 or install Node.js with npm.' }
    Invoke-Checked 'node' (@($localNpm) + $Arguments)
}

function Get-ProjectPython {
    $exe = Join-Path $script:FlameLabRoot '.venv/Scripts/python.exe'
    if (-not (Test-Path -LiteralPath $exe)) { throw 'Run scripts/setup.ps1 first.' }
    return $exe
}
