# Start script for CardSite V3
# This script helps run the application with PowerShell

Write-Host "Starting CardSite V3..." -ForegroundColor Cyan

# Navigate to the project directory if needed
try {
    # Check if package.json exists
    if (-not (Test-Path -Path "package.json" -PathType Leaf)) {
        Write-Host "package.json not found in current directory. Trying project directory..." -ForegroundColor Yellow
        
        # Try to navigate to the project directory
        $projectPath = "C:\Users\evandyke\Documents\cardsiteV3"
        if (Test-Path -Path $projectPath) {
            Set-Location -Path $projectPath
            Write-Host "Changed directory to $projectPath" -ForegroundColor Green
        } else {
            Write-Host "Project directory not found at $projectPath" -ForegroundColor Red
            Write-Host "Please run this script from the project directory" -ForegroundColor Yellow
            exit 1
        }
    }
} catch {
    Write-Host "Error checking directory: $_" -ForegroundColor Red
    exit 1
}

# Run the application
Write-Host "Running npm start..." -ForegroundColor Green
npm start

# If the command fails, provide helpful information
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start the application. Error code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Make sure you have Node.js installed and npm dependencies are installed." -ForegroundColor Yellow
    Write-Host "Try running 'npm install' first if you haven't already." -ForegroundColor Yellow
}

# Keep the window open if there was an error
if ($LASTEXITCODE -ne 0) {
    Write-Host "Press any key to exit..." -ForegroundColor Magenta
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} 