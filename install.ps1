# Install the prebuilt GitHub package into the selected DSH profile.
param(
    [ValidateSet('desktop', 'web')]
    [string]$Profile = 'desktop'
)

$ErrorActionPreference = 'Stop'
if (-not (Get-Command dsh -ErrorAction SilentlyContinue)) {
    throw 'DSH was not found. Open the terminal from the DSH Desktop tray and retry.'
}
# Pinned to a verified commit so pushes to main cannot silently change what runs.
# Update this ref deliberately whenever a new build is verified on the pinned DSH engine.
$Source = 'github:realhenrylan/DSH-Transparent-UI-Plugin#2a32c2f87278a527ea4b5d0e3d302f8ab768700f'
& dsh plugin --profile $Profile add $Source
if ($LASTEXITCODE -ne 0) { throw "Installation failed (exit $LASTEXITCODE)." }
Write-Host 'Restart DSH to load Aqua Glass Henry.'
