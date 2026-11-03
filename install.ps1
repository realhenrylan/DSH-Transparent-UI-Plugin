# Install the prebuilt GitHub package into the selected DSH profile.
param(
    [ValidateSet('desktop', 'web')]
    [string]$Profile = 'desktop'
)

$ErrorActionPreference = 'Stop'
if (-not (Get-Command dsh -ErrorAction SilentlyContinue)) {
    throw 'DSH was not found. Open the terminal from the DSH Desktop tray and retry.'
}
# Track main so the Driftglass package is available; pin a commit or tag for a
# frozen build once it has been verified on the pinned DSH engine.
$Source = 'github:realhenrylan/DSH-Transparent-UI-Plugin#main'
& dsh plugin --profile $Profile add $Source
if ($LASTEXITCODE -ne 0) { throw "Installation failed (exit $LASTEXITCODE)." }
Write-Host 'Restart DSH to load Driftglass.'
