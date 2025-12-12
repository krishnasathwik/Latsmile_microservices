# Push Docker Images to Docker Hub
# Make sure you've logged in first with: docker login

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Pushing LastMile Images to Docker Hub" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$DOCKER_USERNAME = "sathwik049"
$SERVICES = @("auth_service", "driver_service", "rider_service", "matching_service", "location_service", "station_service")

# Check login
docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Docker Hub first:" -ForegroundColor Red
    Write-Host "  docker login"
    exit 1
}

Write-Host "Pushing images..." -ForegroundColor Yellow
Write-Host ""

foreach ($service in $SERVICES) {
    Write-Host "Pushing $DOCKER_USERNAME/lastmile-$service:latest..." -ForegroundColor Green

    docker push "$DOCKER_USERNAME/lastmile-$service:latest"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Successfully pushed lastmile-$service" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to push $service" -ForegroundColor Red
        exit 1
    }

    Write-Host ""
}

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "All images pushed successfully!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Images available at:" -ForegroundColor Yellow

foreach ($service in $SERVICES) {
    Write-Host $("  https://hub.docker.com/r/$DOCKER_USERNAME/lastmile-$service") -ForegroundColor White
}
