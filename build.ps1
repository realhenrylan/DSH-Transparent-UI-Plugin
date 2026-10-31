# Build the distributable files using the repository's local toolchain.
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed (exit $LASTEXITCODE)." }
} finally {
    Pop-Location
}
