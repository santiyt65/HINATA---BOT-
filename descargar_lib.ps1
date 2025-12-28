# Script para descargar archivos de la carpeta lib de NagiBotV3
# Ejecuta este script en PowerShell: .\descargar_lib.ps1

Write-Host "📥 Descargando archivos de lib/ de NagiBotV3..." -ForegroundColor Cyan
Write-Host ""

# Crear carpeta lib si no existe
if (-not (Test-Path "lib")) {
    New-Item -ItemType Directory -Path "lib" | Out-Null
    Write-Host "✅ Carpeta lib/ creada" -ForegroundColor Green
}

# Lista de archivos a descargar
$files = @(
    "canvas.js",
    "cloudDBAdapter.js",
    "converter.js",
    "database.js",
    "ezgif-convert.js",
    "gdrive.js",
    "helper.js",
    "import.js",
    "levelling.js",
    "logs.js",
    "mongoDB.js",
    "plugins.js",
    "print.js",
    "queque.js",
    "scraper.js",
    "simple.js",
    "sticker.js",
    "store.js",
    "tictactoe.js",
    "uploadFile.js",
    "uploadImage.js",
    "webp.js",
    "webp2mp4.js",
    "welcome.js",
    "y2mate.js"
)

$baseUrl = "https://raw.githubusercontent.com/El-brayan502/NagiBotV3/main/lib"
$downloaded = 0
$skipped = 0
$errors = 0

foreach ($file in $files) {
    $url = "$baseUrl/$file"
    $output = "lib\$file"
    
    if (Test-Path $output) {
        Write-Host "⏭️  $file (ya existe)" -ForegroundColor Yellow
        $skipped++
    }
    else {
        try {
            Invoke-WebRequest -Uri $url -OutFile $output -ErrorAction Stop
            Write-Host "✅ $file" -ForegroundColor Green
            $downloaded++
            Start-Sleep -Milliseconds 200
        }
        catch {
            Write-Host "❌ Error al descargar $file" -ForegroundColor Red
            $errors++
        }
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 RESUMEN DE DESCARGA" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Descargados: $downloaded" -ForegroundColor Green
Write-Host "⏭️  Saltados: $skipped" -ForegroundColor Yellow
Write-Host "❌ Errores: $errors" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

if ($errors -eq 0) {
    Write-Host "🎉 ¡Descarga de lib/ completada exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Próximo paso: Instalar dependencias" -ForegroundColor Cyan
    Write-Host "   Ejecuta: npm install" -ForegroundColor White
}
else {
    Write-Host "⚠️  Algunos archivos no se pudieron descargar." -ForegroundColor Yellow
    Write-Host "   Verifica tu conexión e intenta de nuevo." -ForegroundColor White
}

Write-Host ""
Read-Host "Presiona ENTER para salir"