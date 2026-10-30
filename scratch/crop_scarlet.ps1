Add-Type -AssemblyName System.Drawing

$refPath = "C:\Users\kunal\.gemini\antigravity\brain\11ea6300-cd9a-49db-93c8-95d96de0d81b\.user_uploaded\media_1793253393283_2ea06a07.jpg"
$img = [System.Drawing.Bitmap]::FromFile($refPath)

function CropBitmap($src, $rect, $outPath) {
    $target = New-Object System.Drawing.Bitmap($rect.Width, $rect.Height)
    $g = [System.Drawing.Graphics]::FromImage($target)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $dest = New-Object System.Drawing.Rectangle(0, 0, $rect.Width, $rect.Height)
    $g.DrawImage($src, $dest, $rect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $target.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $target.Dispose()
    Write-Host "Saved $outPath ($($rect.Width)x$($rect.Height))"
}

# Main product image:
# Left ~65, Top ~110, Width ~457, Height ~298
CropBitmap $img (New-Object System.Drawing.Rectangle(65, 110, 457, 298)) "public/scarlet-diamond-main.png"

# Thumbnails:
# Thumb 1: ~152, 423, Width ~80, Height ~68
CropBitmap $img (New-Object System.Drawing.Rectangle(152, 423, 80, 68)) "public/scarlet-diamond-thumb1.png"
# Thumb 2: ~239, 423, Width ~95, Height ~68
CropBitmap $img (New-Object System.Drawing.Rectangle(239, 423, 95, 68)) "public/scarlet-diamond-thumb2.png"
# Thumb 3: ~338, 423, Width ~98, Height ~68
CropBitmap $img (New-Object System.Drawing.Rectangle(338, 423, 98, 68)) "public/scarlet-diamond-thumb3.png"

# Notes illustration crops:
# Top notes: x: 495, y: 520, width: 120, height: 60
CropBitmap $img (New-Object System.Drawing.Rectangle(490, 520, 125, 60)) "public/note-saffron.png"
# Heart notes: x: 650, y: 520, width: 120, height: 60
CropBitmap $img (New-Object System.Drawing.Rectangle(650, 520, 125, 60)) "public/note-rose.png"
# Base notes: x: 810, y: 520, width: 120, height: 60
CropBitmap $img (New-Object System.Drawing.Rectangle(810, 520, 125, 60)) "public/note-oud.png"

$img.Dispose()

