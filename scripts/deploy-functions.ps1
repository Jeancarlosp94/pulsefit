# scripts/deploy-functions.ps1
# Helper para deployar todas las Edge Functions de PulseFit con un solo comando.
#
# USO desde la raíz del proyecto:
#   .\scripts\deploy-functions.ps1            # deploya todas
#   .\scripts\deploy-functions.ps1 workout    # solo workout-session
#   .\scripts\deploy-functions.ps1 meal       # solo meal-plan + meal-options
#   .\scripts\deploy-functions.ps1 review     # solo weekly-review
#
# Requisitos:
#   1. Estar logueado: `npx supabase login`
#   2. (Opcional) `npx supabase link --project-ref jhktlubijlyzswldmncu`

param(
   [string]$Target = "all"
)

$ProjectRef = "jhktlubijlyzswldmncu"

# Verificar que estamos en la raíz del proyecto
if (-not (Test-Path "supabase/functions")) {
   Write-Host "❌ ERROR: ejecuta este script desde la raíz del proyecto." -ForegroundColor Red
   Write-Host "   Asegúrate que existe 'supabase/functions/' en el directorio actual." -ForegroundColor Yellow
   Write-Host "   Directorio actual: $(Get-Location)" -ForegroundColor Yellow
   exit 1
}

$Functions = @{
   "workout" = @("generate-workout-session")
   "meal"    = @("generate-meal-plan", "generate-meal-options")
   "review"  = @("weekly-review")
   "all"     = @("generate-workout-session", "generate-meal-plan", "generate-meal-options", "weekly-review")
}

if (-not $Functions.ContainsKey($Target)) {
   Write-Host "❌ Target '$Target' no reconocido. Usa: workout / meal / review / all" -ForegroundColor Red
   exit 1
}

$toDeploy = $Functions[$Target]

Write-Host ""
Write-Host "🚀 Deployando $($toDeploy.Count) Edge Function(s) a project-ref=$ProjectRef" -ForegroundColor Cyan
Write-Host ""

$success = 0
$failed = 0

foreach ($fn in $toDeploy) {
   Write-Host "▶ $fn..." -ForegroundColor Yellow
   npx supabase functions deploy $fn --project-ref $ProjectRef
   if ($LASTEXITCODE -eq 0) {
      Write-Host "  ✅ $fn deployada" -ForegroundColor Green
      $success++
   } else {
      Write-Host "  ❌ $fn falló" -ForegroundColor Red
      $failed++
   }
   Write-Host ""
}

Write-Host "🎉 Resumen: $success deployadas / $failed fallidas" -ForegroundColor Cyan
