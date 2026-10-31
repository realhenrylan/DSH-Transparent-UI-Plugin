# Install the prebuilt GitHub package into the selected DSH profile.
param(
    [ValidateSet('desktop', 'web')]
    [string]$Profile = 'desktop'
)

$ErrorActionPreference = 'Stop'
if (-not (Get-Command dsh -ErrorAction SilentlyContinue)) {
    throw 'DSH was not found. Open the terminal from the DSH Desktop tray and retry.'
}
& dsh plugin --profile $Profile add 'github:realhenrylan/DSH-Transparent-UI-Plugin#main'
if ($LASTEXITCODE -ne 0) { throw "Installation failed (exit $LASTEXITCODE)." }
Write-Host 'Restart DSH to load Aqua Glass Henry.'
