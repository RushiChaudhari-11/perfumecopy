Add-Type -AssemblyName System.Drawing
$b2 = [System.Drawing.Bitmap]::FromFile("C:\Users\kunal\.gemini\antigravity\brain\11ea6300-cd9a-49db-93c8-95d96de0d81b\.user_uploaded\media_1793166404410_f95c331a.png")

# Let's inspect x from 0 to 450 at y=300:
for ($x = 0; $x -lt 150; $x += 10) {
    $p = $b2.GetPixel($x, 300)
    Write-Host "x=$x R=$($p.R) G=$($p.G) B=$($p.B)"
}

$b2.Dispose()

