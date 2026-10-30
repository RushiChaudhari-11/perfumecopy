Add-Type -AssemblyName System.Drawing

$img1Path = "C:\Users\kunal\.gemini\antigravity\brain\11ea6300-cd9a-49db-93c8-95d96de0d81b\.user_uploaded\media_1793166392992_4d83283d.png"
$img2Path = "C:\Users\kunal\.gemini\antigravity\brain\11ea6300-cd9a-49db-93c8-95d96de0d81b\.user_uploaded\media_1793166404410_f95c331a.png"

$b1 = [System.Drawing.Bitmap]::FromFile($img1Path)
$b2 = [System.Drawing.Bitmap]::FromFile($img2Path)

function CropBitmap($src, $rect, $outPath) {
    # We can also upscale by 2x or 3x with bicubic filtering for ultra sharpness!
    $scale = 3
    $target = New-Object System.Drawing.Bitmap(($rect.Width * $scale), ($rect.Height * $scale))
    $g = [System.Drawing.Graphics]::FromImage($target)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $destRect = New-Object System.Drawing.Rectangle(0, 0, ($rect.Width * $scale), ($rect.Height * $scale))
    $g.DrawImage($src, $destRect, $rect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $target.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $target.Dispose()
    Write-Host "Saved upscaled image: $outPath ($($rect.Width * $scale) x $($rect.Height * $scale))"
}

# 1. Perfumes: x=43, width=176, y=59, photo height=175, full height=200
CropBitmap $b1 (New-Object System.Drawing.Rectangle(43, 59, 176, 175)) "public/collection-perfumes.png"
CropBitmap $b1 (New-Object System.Drawing.Rectangle(43, 59, 176, 200)) "public/collection-perfumes-full.png"

# 2. Nano Fresheners: x=232, width=175, y=59, photo height=175, full height=200
CropBitmap $b1 (New-Object System.Drawing.Rectangle(232, 59, 175, 175)) "public/collection-nano.png"
CropBitmap $b1 (New-Object System.Drawing.Rectangle(232, 59, 175, 200)) "public/collection-nano-full.png"

# 3. Gift Sets: x=420, width=176, y=59, photo height=175, full height=200
CropBitmap $b1 (New-Object System.Drawing.Rectangle(420, 59, 176, 175)) "public/collection-giftsets.png"
CropBitmap $b1 (New-Object System.Drawing.Rectangle(420, 59, 176, 200)) "public/collection-giftsets-full.png"

# 4. Air Fresheners: x=608, width=176, y=59, photo height=175, full height=200
CropBitmap $b1 (New-Object System.Drawing.Rectangle(608, 59, 176, 175)) "public/collection-airfresheners.png"
CropBitmap $b1 (New-Object System.Drawing.Rectangle(608, 59, 176, 200)) "public/collection-airfresheners-full.png"

# 5. Deodorants: x=797, width=176, y=59, photo height=175, full height=200
CropBitmap $b1 (New-Object System.Drawing.Rectangle(797, 59, 176, 175)) "public/collection-deodorants.png"
CropBitmap $b1 (New-Object System.Drawing.Rectangle(797, 59, 176, 200)) "public/collection-deodorants-full.png"

# 6. Body Talc (from b2): x=34, width=328, y=101, photo height=326, full height=373
CropBitmap $b2 (New-Object System.Drawing.Rectangle(34, 101, 328, 326)) "public/collection-bodytalc.png"
CropBitmap $b2 (New-Object System.Drawing.Rectangle(34, 101, 328, 373)) "public/collection-bodytalc-full.png"

$b1.Dispose()
$b2.Dispose()
Write-Host "All 6 collections cropped and saved to public/ successfully!"

