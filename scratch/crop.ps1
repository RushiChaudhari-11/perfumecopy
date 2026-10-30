Add-Type -AssemblyName System.Drawing

$img1Path = "C:\Users\kunal\.gemini\antigravity\brain\11ea6300-cd9a-49db-93c8-95d96de0d81b\.user_uploaded\media_1793166392992_4d83283d.png"
$img2Path = "C:\Users\kunal\.gemini\antigravity\brain\11ea6300-cd9a-49db-93c8-95d96de0d81b\.user_uploaded\media_1793166404410_f95c331a.png"

$img1 = [System.Drawing.Bitmap]::FromFile($img1Path)
$img2 = [System.Drawing.Bitmap]::FromFile($img2Path)

Write-Host "Img1 size: $($img1.Width) x $($img1.Height)"
Write-Host "Img2 size: $($img2.Width) x $($img2.Height)"

$img1.Dispose()
$img2.Dispose()

