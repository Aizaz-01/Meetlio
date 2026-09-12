$ProjectPath = "C:\Users\O M E N\.gemini\antigravity\scratch\meetlio"
$DebounceSeconds = 15

Set-Location $ProjectPath

Write-Host "======================================" -ForegroundColor Cyan
Write-Host " Meetlio Auto GitHub Sync" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Watching: $ProjectPath"
Write-Host "Changes will sync after $DebounceSeconds seconds of inactivity."
Write-Host "Press Ctrl+C to stop."
Write-Host ""

$lastStatus = ""
$lastChangeTime = $null

while ($true) {

    $status = git status --porcelain 2>$null
    $currentStatus = ($status -join "`n").Trim()

    if ($currentStatus -ne $lastStatus) {

        if ($currentStatus -ne "") {
            Write-Host ""
            Write-Host "Change detected..." -ForegroundColor Yellow
            $lastChangeTime = Get-Date
        }

        $lastStatus = $currentStatus
    }

    if ($currentStatus -ne "" -and $lastChangeTime -ne $null) {

        $elapsed = ((Get-Date) - $lastChangeTime).TotalSeconds

        if ($elapsed -ge $DebounceSeconds) {

            Write-Host ""
            Write-Host "Syncing changes to GitHub..." -ForegroundColor Cyan

            git add -A

            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            git commit -m "Auto sync: $timestamp"

            if ($LASTEXITCODE -eq 0) {
                git push

                if ($LASTEXITCODE -eq 0) {
                    Write-Host "Successfully synced to GitHub!" -ForegroundColor Green
                }
                else {
                    Write-Host "Push failed. Will retry when another change is detected." -ForegroundColor Red
                }
            }

            $lastChangeTime = $null
            $lastStatus = ""
        }
    }

    Start-Sleep -Seconds 3
}