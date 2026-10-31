# Inspect the GitHub-installable package without publishing the upstream name.
param([switch]$DryRun)

$ErrorActionPreference = 'Stop'
if (-not $DryRun) {
    throw 'npm publishing is not configured for this fork. Install the GitHub package as described in README.md.'
}
Push-Location $PSScriptRoot
try {
    npm pack --dry-run --ignore-scripts
    if ($LASTEXITCODE -ne 0) { throw "Package inspection failed (exit $LASTEXITCODE)." }
} finally {
    Pop-Location
}
