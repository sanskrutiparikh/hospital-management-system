# stop-all.ps1
# Script to read PIDs and stop all running microservices

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Stopping MedPulse Hospital Microservices..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$pidsFile = "$PSScriptRoot\.service-pids.json"
if (Test-Path $pidsFile) {
    $pids = Get-Content $pidsFile | ConvertFrom-Json
    foreach ($name in $pids.PSObject.Properties.Name) {
        $pidVal = $pids.$name
        if ($pidVal) {
            Write-Host "Stopping $name (PID $pidVal)..." -ForegroundColor Yellow
            try {
                Stop-Process -Id $pidVal -Force -ErrorAction Stop
                Write-Host "$name stopped successfully." -ForegroundColor Green
            } catch {
                Write-Host "Could not stop $name. Error: $($_.Exception.Message)" -ForegroundColor DarkYellow
            }
        }
    }
    Remove-Item $pidsFile -ErrorAction SilentlyContinue
} else {
    Write-Host "No .service-pids.json file found. Searching for running java microservices..." -ForegroundColor Yellow
    Get-CimInstance Win32_Process -Filter "Name = 'java.exe'" | ForEach-Object {
        if ($_.CommandLine -like "*eureka-server*" -or $_.CommandLine -like "*auth-service*" -or $_.CommandLine -like "*patient-service*" -or $_.CommandLine -like "*doctor-service*" -or $_.CommandLine -like "*appointment-service*" -or $_.CommandLine -like "*billing-service*" -or $_.CommandLine -like "*api-gateway*") {
            Write-Host "Stopping process PID $($_.ProcessId) ($($_.CommandLine.Split(' ')[0]))" -ForegroundColor Yellow
            Stop-Process -Id $_.ProcessId -Force
        }
    }
}

Write-Host "==========================================" -ForegroundColor Green
Write-Host "All microservices stopped." -ForegroundColor Green
