Add-Type -AssemblyName System.Drawing

$img1Path = "C:\Users\kunal\.gemini\antigravity\brain\11ea6300-cd9a-49db-93c8-95d96de0d81b\.user_uploaded\media_1793166392992_4d83283d.png"
$img2Path = "C:\Users\kunal\.gemini\antigravity\brain\11ea6300-cd9a-49db-93c8-95d96de0d81b\.user_uploaded\media_1793166404410_f95c331a.png"

$b1 = [System.Drawing.Bitmap]::FromFile($img1Path)
$b2 = [System.Drawing.Bitmap]::FromFile($img2Path)

# In img1 (1024 x 293):
# Title "Our Collection" is around y = 15 to 45
# Cards start around y = 60 to 280
# Let's inspect some pixels
Write-Host "img1 pixel at (50, 100):" ($b1.GetPixel(50, 100).ToString())

# Let's find card X ranges
# Card 1 (Perfumes): around x=42 to x=217 (width ~175)
# Card 2 (Nano): around x=232 to x=400
# Card 3 (Gift Sets): around x=415 to x=585
# Card 4 (Air Fresheners): around x=600 to x=770
# Card 5 (Deodorants): around x=785 to x=955

# Let's crop cards:
# y range for cards: from y=58 to y=278 (height=220)
# Let's save each card image (just the photo portion above the yellow banner, or the full card)
# If yellow banner is at bottom: y=250 to 278 (height=28)
# Photo area: y=58 to y=250 (height=192)

function CropBitmap($src, $rect, $outPath) {
    $target = New-Object System.Drawing.Bitmap($rect.Width, $rect.Height)
    $g = [System.Drawing.Graphics]::FromImage($target)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $rect.Width, $rect.Height)), $rect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $target.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $target.Dispose()
    Write-Host "Saved: $outPath ($($rect.Width)x$($rect.Height))"
}

# Let's crop the 5 cards from img1:
# Card 1: x: 42, width: 175, y: 58, height: 190 (photo only) and 220 (with banner)
# Let's also inspect yellow banner y:
for ($y = 220; $y -lt 280; $y += 5) {
    $p = $b1.GetPixel(100, $y)
    Write-Host "y=$y R=$($p.R) G=$($p.G) B=$($p.B)"
}

$b1.Dispose()
$b2.Dispose()

