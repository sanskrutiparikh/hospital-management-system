# run-all.ps1
# Script to start all microservices locally in background processes and redirect their logs

$logDir = "$PSScriptRoot\logs"
if (!(Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Starting MedPulse Hospital Microservices..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Start Eureka Server
Write-Host "1. Starting Eureka Server (Port 8761)..." -ForegroundColor Yellow
$eurekaJob = Start-Process java -ArgumentList "-Xmx192m -jar target/eureka-server-0.0.1-SNAPSHOT.jar" -WorkingDirectory "$PSScriptRoot\eureka-server" -NoNewWindow -PassThru -RedirectStandardOutput "$logDir\eureka-server.log" -RedirectStandardError "$logDir\eureka-server.err"
Write-Host "Eureka Server started with PID: $($eurekaJob.Id)"

Write-Host "Waiting 12 seconds for Eureka Server to initialize..." -ForegroundColor DarkGray
Start-Sleep -Seconds 12

# 2. Start Core Services
Write-Host "2. Starting Database-backed Core Services..." -ForegroundColor Yellow

$authJob = Start-Process java -ArgumentList "-Xmx192m -jar target/auth-service-0.0.1-SNAPSHOT.jar" -WorkingDirectory "$PSScriptRoot\auth-service" -NoNewWindow -PassThru -RedirectStandardOutput "$logDir\auth-service.log" -RedirectStandardError "$logDir\auth-service.err"
Write-Host "Auth Service started with PID: $($authJob.Id)"

$patientJob = Start-Process java -ArgumentList "-Xmx192m -jar target/patient-service-0.0.1-SNAPSHOT.jar" -WorkingDirectory "$PSScriptRoot\patient-service" -NoNewWindow -PassThru -RedirectStandardOutput "$logDir\patient-service.log" -RedirectStandardError "$logDir\patient-service.err"
Write-Host "Patient Service started with PID: $($patientJob.Id)"

$doctorJob = Start-Process java -ArgumentList "-Xmx192m -jar target/doctor-service-0.0.1-SNAPSHOT.jar" -WorkingDirectory "$PSScriptRoot\doctor-service" -NoNewWindow -PassThru -RedirectStandardOutput "$logDir\doctor-service.log" -RedirectStandardError "$logDir\doctor-service.err"
Write-Host "Doctor Service started with PID: $($doctorJob.Id)"

$appointmentJob = Start-Process java -ArgumentList "-Xmx192m -jar target/appointment-service-0.0.1-SNAPSHOT.jar" -WorkingDirectory "$PSScriptRoot\appointment-service" -NoNewWindow -PassThru -RedirectStandardOutput "$logDir\appointment-service.log" -RedirectStandardError "$logDir\appointment-service.err"
Write-Host "Appointment Service started with PID: $($appointmentJob.Id)"

$billingJob = Start-Process java -ArgumentList "-Xmx192m -jar target/billing-service-0.0.1-SNAPSHOT.jar" -WorkingDirectory "$PSScriptRoot\billing-service" -NoNewWindow -PassThru -RedirectStandardOutput "$logDir\billing-service.log" -RedirectStandardError "$logDir\billing-service.err"
Write-Host "Billing Service started with PID: $($billingJob.Id)"

Write-Host "Waiting 10 seconds for Core Services to boot and register with Eureka..." -ForegroundColor DarkGray
Start-Sleep -Seconds 10

# 3. Start API Gateway
Write-Host "3. Starting API Gateway (Port 9090)..." -ForegroundColor Yellow
$gatewayJob = Start-Process java -ArgumentList "-Xmx192m -jar target/api-gateway-0.0.1-SNAPSHOT.jar" -WorkingDirectory "$PSScriptRoot\api-gateway" -NoNewWindow -PassThru -RedirectStandardOutput "$logDir\api-gateway.log" -RedirectStandardError "$logDir\api-gateway.err"
Write-Host "API Gateway started with PID: $($gatewayJob.Id)"

# 4. Save PIDs for stop script
$pidsObj = @{
    Eureka = $eurekaJob.Id
    Auth = $authJob.Id
    Patient = $patientJob.Id
    Doctor = $doctorJob.Id
    Appointment = $appointmentJob.Id
    Billing = $billingJob.Id
    Gateway = $gatewayJob.Id
}
$pidsObj | ConvertTo-Json | Out-File -FilePath "$PSScriptRoot\.service-pids.json" -Encoding utf8

Write-Host "------------------------------------------" -ForegroundColor Green
Write-Host "All backend microservices successfully spawned!" -ForegroundColor Green
Write-Host "Logs are located in: $logDir" -ForegroundColor Green
Write-Host "You can stop all services by running: .\stop-all.ps1" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Keep script running to prevent background processes from being cleaned up
Write-Host "Keeping script active to maintain services. Press Ctrl+C to terminate." -ForegroundColor Cyan
while ($true) {
    Start-Sleep -Seconds 10
}

