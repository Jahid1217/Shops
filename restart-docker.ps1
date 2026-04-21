$dockerPath = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
$env:PATH = "C:\Program Files\Docker\Docker\resources\bin;$env:PATH"

# Add to current session PATH
$env:PATH = "$env:PATH;C:\Program Files\Docker\Docker\resources\bin"

Set-Alias docker $dockerPath

# Stop containers
Write-Host "Stopping containers..." -ForegroundColor Cyan
& $dockerPath compose down -v --remove-orphans

Start-Sleep -Seconds 2

# Rebuild and start
Write-Host "Building and starting containers..." -ForegroundColor Cyan
& $dockerPath compose up -d --build

Write-Host "Containers started! Checking status..." -ForegroundColor Green
Start-Sleep -Seconds 3

& $dockerPath ps
