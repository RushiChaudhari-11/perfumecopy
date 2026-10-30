Add-Type -AssemblyName System.Drawing

$b1 = [System.Drawing.Bitmap]::FromFile("C:\Users\kunal\.gemini\antigravity\brain\11ea6300-cd9a-49db-93c8-95d96de0d81b\.user_uploaded\media_1793166392992_4d83283d.png")
$b2 = [System.Drawing.Bitmap]::FromFile("C:\Users\kunal\.gemini\antigravity\brain\11ea6300-cd9a-49db-93c8-95d96de0d81b\.user_uploaded\media_1793166404410_f95c331a.png")

# Find top of cards in b1 (look down at x=100 from y=0 to 100)
$cardTop = 0
for ($y = 0; $y -lt 100; $y++) {
    $p = $b1.GetPixel(100, $y)
    # Check if not pure white
    if ($p.R -lt 245 -or $p.G -lt 245 -or $p.B -lt 245) {
        $cardTop = $y
        break
    }
}

# Find bottom of yellow banner at x=100
$bannerBottom = 0
for ($y = 255; $y -lt 290; $y++) {
    $p = $b1.GetPixel(100, $y)
    if ($p.R -gt 250 -and $p.G -gt 250 -and $p.B -gt 250) {
        $bannerBottom = $y
        break
    }
}

Write-Host "img1 CardTop: $cardTop, BannerBottom: $bannerBottom"

# Now let's scan horizontally across y = 150 to find the card left/right edges in b1:
$inCard = $false
$startX = 0
$cards = @()
for ($x = 0; $x -lt $b1.Width; $x++) {
    $p = $b1.GetPixel($x, 150)
    $isWhite = ($p.R -gt 250 -and $p.G -gt 250 -and $p.B -gt 250)
    if (-not $inCard -and -not $isWhite) {
        $inCard = $true
        $startX = $x
    } elseif ($inCard -and $isWhite) {
        $inCard = $false
        $cards += [PSCustomObject]@{ Left = $startX; Right = $x; Width = ($x - $startX) }
    }
}
Write-Host "img1 Detected cards: $($cards.Count)"
foreach ($c in $cards) {
    Write-Host "Card: Left=$($c.Left), Right=$($c.Right), Width=$($c.Width)"
}

# Now inspect b2 (which has Body Talc)
Write-Host "Inspecting b2 (Body Talc)..."
$b2Top = 0
for ($y = 0; $y -lt 200; $y++) {
    $p = $b2.GetPixel(200, $y)
    if ($p.R -lt 245 -or $p.G -lt 245 -or $p.B -lt 245) {
        $b2Top = $y
        break
    }
}
$b2Bottom = 0
for ($y = 550; $y -gt 200; $y--) {
    $p = $b2.GetPixel(200, $y)
    if ($p.R -lt 250 -or $p.G -lt 250 -or $p.B -lt 250) {
        $b2Bottom = $y
        break
    }
}

$b2Left = 0
for ($x = 0; $x -lt 200; $x++) {
    $p = $b2.GetPixel($x, 250)
    if ($p.R -lt 245 -or $p.G -lt 245 -or $p.B -lt 245) {
        $b2Left = $x
        break
    }
}
$b2Right = 0
for ($x = $b2.Width - 1; $x -gt 200; $x--) {
    $p = $b2.GetPixel($x, 250)
    if ($p.R -lt 245 -or $p.G -lt 245 -or $p.B -lt 245) {
        $b2Right = $x
        break
    }
}
Write-Host "b2 Card: Left=$b2Left, Right=$b2Right, Top=$b2Top, Bottom=$b2Bottom"

$b1.Dispose()
$b2.Dispose()

