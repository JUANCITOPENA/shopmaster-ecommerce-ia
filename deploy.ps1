# Script de Automatización de Despliegue en GitHub y GitHub Pages
$ErrorActionPreference = "Stop"

# 1. Obtener Token de GitHub Credential Manager
$creds = "protocol=https`nhost=github.com" | git credential fill
$token = ""
foreach ($line in ($creds -split "`n")) {
    if ($line -match "^password=(.+)$") {
        $token = $matches[1].Trim()
    }
}

if (-not $token) {
    Write-Error "No se pudo obtener el token de GitHub."
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Accept"        = "application/vnd.github.v3+json"
    "User-Agent"    = "ShopMaster-Deployer"
}

$repoName = "shopmaster-ecommerce-ia"
$owner = "JUANCITOPENA"

Write-Host "Verificando si el repositorio $repoName ya existe en GitHub..."
$repoExists = $false
try {
    $existing = Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repoName" -Headers $headers -Method Get
    Write-Host "Repositorio ya existente: $($existing.html_url)"
    $repoExists = $true
} catch {
    Write-Host "El repositorio no existe aún. Creándolo..."
}

if (-not $repoExists) {
    $body = @{
        name        = $repoName
        description = "Tienda Virtual E-Commerce con FakeStore API, Carrito LocalStorage y Ticket Térmico en PDF (jsPDF)"
        private     = $false
        has_issues  = $true
        has_projects= $true
        has_wiki    = $true
    } | ConvertTo-Json

    $newRepo = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Headers $headers -Method Post -Body $body
    Write-Host "Repositorio creado exitosamente: $($newRepo.html_url)"
}

# 2. Inicializar Git y subir los archivos
Set-Location "C:\Users\User\Desktop\E-Commerce_ShopMaster_IA"

# Eliminar archivo temporal de deploy antes de commitear
if (Test-Path "deploy_check.ps1") { Remove-Item "deploy_check.ps1" -Force }

if (-not (Test-Path ".git")) {
    git init
}

git config user.name "JUANCITOPENA"
git config user.email "JUANCITO.PENA.V@HOTMAIL.COM"

git branch -M main

# Configurar remote con autenticación embebida o normal
$remoteUrl = "https://$($owner):$($token)@github.com/$owner/$repoName.git"
git remote remove origin 2>$null
git remote add origin $remoteUrl

git add .
git commit -m "Feat: Tienda Virtual ShopMaster con IA, FakeStore API y Ticket Térmico en PDF"

Write-Host "Subiendo archivos a GitHub..."
git push -u origin main --force

# Limpiar token de remote URL para seguridad (dejarlo estándar)
git remote set-url origin "https://github.com/$owner/$repoName.git"

# 3. Habilitar GitHub Pages mediante API
Write-Host "Configurando GitHub Pages en la rama main..."
Start-Sleep -Seconds 2

try {
    $pagesBody = @{
        source = @{
            branch = "main"
            path   = "/"
        }
    } | ConvertTo-Json

    $pagesRes = Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repoName/pages" -Headers $headers -Method Post -Body $pagesBody
    Write-Host "GitHub Pages activado con éxito: $($pagesRes.html_url)"
} catch {
    # Si ya estaba activado, consultar estado
    try {
        $pagesRes = Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repoName/pages" -Headers $headers -Method Get
        Write-Host "GitHub Pages ya configurado: $($pagesRes.html_url)"
    } catch {
        Write-Warning "Aviso sobre Pages: $($_.Exception.Message)"
    }
}

$repoUrl = "https://github.com/$owner/$repoName"
$pagesUrl = "https://$($owner.ToLower()).github.io/$repoName/"

Write-Host "`n========================================================"
Write-Host "DESPLIEGUE COMPLETADO CON ÉXITO"
Write-Host "URL Repositorio : $repoUrl"
Write-Host "URL GitHub Pages: $pagesUrl"
Write-Host "========================================================"
