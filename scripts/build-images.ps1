# Build and Push Docker Images for LastMile Backend Services
# Docker Hub username: sathwik049

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Building LastMile Backend Docker Images" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$DOCKER_USERNAME = "sathwik049"
$SERVICES = @("auth_service", "driver_service", "rider_service", "matching_service", "location_service", "station_service")
$PROJECT_ROOT = "c:\Users\krish\OneDrive\Desktop\Lastmile_application"

# Change to project root directory (build context)
Set-Location $PROJECT_ROOT

Write-Host "Building images..." -ForegroundColor Yellow
Write-Host ""

foreach ($service in $SERVICES) {
    Write-Host "Building $service..." -ForegroundColor Green
    
    # Build the Docker image from project root as build context
    # Dockerfile is at Backend/services/SERVICE/Dockerfile
    docker build -t "${DOCKER_USERNAME}/lastmile-${service}:latest" -f "Backend/services/${service}/Dockerfile" .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully built ${DOCKER_USERNAME}/lastmile-${service}:latest" -ForegroundColor Green
    } else {
        Write-Host "Failed to build ${service}" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "All images built successfully!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To push images to Docker Hub, run:" -ForegroundColor Yellow
Write-Host "  docker login" -ForegroundColor White
Write-Host "  .\push-images.ps1" -ForegroundColor White
Write-Host ""
Write-Host "To list built images:" -ForegroundColor Yellow
Write-Host "  docker images | findstr lastmile" -ForegroundColor White
