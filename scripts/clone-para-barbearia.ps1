param(
  [string]$Source = "C:\projetos\salao_rf_sistema",
  [string]$Target = "C:\projetos\salao_barbearia_sistema"
)

if (Test-Path $Target) {
  throw "O diretório de destino já existe: $Target"
}

Copy-Item -Path $Source -Destination $Target -Recurse -Force

$packageJson = Join-Path $Target "package.json"
(Get-Content $packageJson) -replace 'salao_rf_sistema', 'salao_barbearia_sistema' | Set-Content $packageJson

Write-Host "Clone criado em $Target"
Write-Host "Execute: npm install ; npx prisma migrate deploy ; npm run build"
