Add-Type -AssemblyName System.Drawing

$refPath = "C:\Users\kunal\.gemini\antigravity\brain\11ea6300-cd9a-49db-93c8-95d96de0d81b\.user_uploaded\media_1793253393283_2ea06a07.jpg"
$img = [System.Drawing.Bitmap]::FromFile($refPath)
Write-Host "Reference image size: $($img.Width) x $($img.Height)"
$img.Dispose()

