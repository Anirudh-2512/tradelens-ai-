#!/usr/bin/env pwsh
$env = Get-Content ".env.local" | Where-Object { $_ -match "^[A-Z0-9_]+=" } | ForEach-Object {
  $name, $value = $_ -split "=", 2
  [PSCustomObject]@{ Name = $name; Value = $value.Trim() }
}
$deployed = @()
foreach ($e in $env) {
  if (-not $e.Value) { continue }
  $e.Value | npx vercel env add $e.Name production 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) { $deployed += $e.Name } else { Write-Host "FAILED: $($e.Name)" }
}
Write-Host "OK: $($deployed -join ', ')"
