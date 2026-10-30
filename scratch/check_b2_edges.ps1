Add-Type -AssemblyName System.Drawing
$b2 = [System.Drawing.Bitmap]::FromFile("C:\Users\kunal\.gemini\antigravity\brain\11ea6300-cd9a-49db-93c8-95d96de0d81b\.user_uploaded\media_1793166404410_f95c331a.png")

# Find left boundary around x=30..40
for ($x = 25; $x -lt 45; $x++) {
    $p = $b2.GetPixel($x, 300)
    if ($p.R -lt 250 -or $p.G -lt 250 -or $p.B -lt 250) {
        Write-Host "b2 Card left edge at: $x"
        break
    }
}

# Find right boundary of Body Talc
for ($x = 350; $x -lt 450; $x++) {
    $p = $b2.GetPixel($x, 300)
    if ($p.R -gt 250 -and $p.G -gt 250 -and $p.B -gt 250) {
        Write-Host "b2 Card right edge at: $x"
        break
    }
}

# Find top edge of Body Talc card at x=200
for ($y = 80; $y -lt 120; $y++) {
    $p = $b2.GetPixel(200, $y)
    if ($p.R -lt 250 -or $p.G -lt 250 -or $p.B -lt 250) {
        Write-Host "b2 Card top edge at: $y"
        break
    }
}

# Find bottom edge of Body Talc card at x=200
for ($y = 450; $y -lt 550; $y++) {
    $p = $b2.GetPixel(200, $y)
    if ($p.R -gt 250 -and $p.G -gt 250 -and $p.B -gt 250) {
        Write-Host "b2 Card bottom edge at: $y"
        break
    }
}

$b2.Dispose()

