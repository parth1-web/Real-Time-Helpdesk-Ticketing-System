# Run fullstack with ONE backend port (integrated mode).
# Frontend is built into src/Helpdesk.API/wwwroot and served by ASP.NET Core,
# so http://localhost:5000 serves API (/api, /hubs, /swagger) + UI (/, /dashboard...).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
Write-Host "1/2 Building frontend -> src/Helpdesk.API/wwwroot ..." -ForegroundColor Cyan
Set-Location "$root/frontend/helpdesk-web"
if (-not (Test-Path "node_modules")) { npm install }
npm run build
Set-Location $root
Write-Host "2/2 Starting backend on http://localhost:5000 ..." -ForegroundColor Cyan
dotnet run --project src/Helpdesk.API --urls http://localhost:5000
