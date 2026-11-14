. (Join-Path $PSScriptRoot 'common.ps1')
Push-Location -LiteralPath $script:FlameLabRoot
try {
    $pythonExe = Get-ProjectPython
    Invoke-Checked $pythonExe @('-m','ruff','check','apps/api','scripts','evals')
    Invoke-Checked $pythonExe @('-m','pytest','-q')
    Invoke-Checked $pythonExe @('evals/science/run.py')
    Invoke-Checked $pythonExe @('evals/science/segment_run.py')
    Invoke-Checked $pythonExe @('evals/science/metric_availability_run.py')
    Invoke-Checked $pythonExe @('evals/ai/run.py')
    if ($env:FLAMELAB_NASA_BUNDLE) {
        Invoke-Checked $pythonExe @('evals/science/corpus_run.py','--bundle',$env:FLAMELAB_NASA_BUNDLE)
    }
    Invoke-Checked $pythonExe @('scripts/export-openapi.py','--check')
    Invoke-ProjectNpm @('run','check:types')
    Invoke-ProjectNpm @('run','typecheck')
    Invoke-ProjectNpm @('run','test:client')
    Invoke-ProjectNpm @('run','build')
    Invoke-Checked $pythonExe @('scripts/smoke.py')
} finally { Pop-Location }
