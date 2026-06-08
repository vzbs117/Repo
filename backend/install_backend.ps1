param(
    [switch]$CheckOnly,
    [switch]$SkipTests,
    [switch]$Run
)

$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$VenvDir = Join-Path $ProjectDir ".venv"
$PythonCommand = if ($env:PYTHON_BIN) { $env:PYTHON_BIN } else { "python" }

function Write-Log {
    param([string]$Message)
    Write-Host ""
    Write-Host "[backend-installer] $Message"
}

function Write-WarnMessage {
    param([string]$Message)
    Write-Host ""
    Write-Host "[backend-installer] AVISO: $Message" -ForegroundColor Yellow
}

function Fail {
    param([string]$Message)
    throw "[backend-installer] ERROR: $Message"
}

function Ensure-Command {
    param(
        [string]$CommandName,
        [string]$InstallHint
    )

    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        Fail "No se encontro '$CommandName'. $InstallHint"
    }
}

function Test-PythonVersion {
    $version = & $PythonCommand -c "import sys; minimum=(3,11); current=sys.version_info[:3]; \
if current < minimum: raise SystemExit(f'Python {minimum[0]}.{minimum[1]} o superior es requerido. Version detectada: {current[0]}.{current[1]}.{current[2]}'); \
print(f'{current[0]}.{current[1]}.{current[2]}')"

    Write-Log "Python detectado: $version"
}

function Test-VenvSupport {
    & $PythonCommand -m venv --help | Out-Null
}

function Create-VenvIfMissing {
    if (Test-Path $VenvDir) {
        Write-Log "Entorno virtual encontrado en $VenvDir"
        return
    }

    Write-Log "Creando entorno virtual en $VenvDir"
    & $PythonCommand -m venv $VenvDir
}

function Install-Dependencies {
    $venvPython = Join-Path $VenvDir "Scripts\python.exe"
    $venvPip = Join-Path $VenvDir "Scripts\pip.exe"

    Write-Log "Actualizando pip"
    try {
        & $venvPython -m pip install --upgrade pip
    }
    catch {
        Write-WarnMessage "No se pudo actualizar pip. Continuare con la instalacion usando la version disponible."
    }

    Write-Log "Instalando dependencias del backend"
    & $venvPip install -r (Join-Path $ProjectDir "requirements.txt")
}

function Ensure-EnvFile {
    $envPath = Join-Path $ProjectDir ".env"
    $envExamplePath = Join-Path $ProjectDir ".env.example"

    if (Test-Path $envPath) {
        Write-Log "Archivo .env existente detectado"
        return
    }

    Write-Log "Creando .env desde .env.example"
    Copy-Item $envExamplePath $envPath
}

function Run-BackendTests {
    $venvPython = Join-Path $VenvDir "Scripts\python.exe"
    Write-Log "Ejecutando pruebas del backend"
    & $venvPython -m unittest discover -s (Join-Path $ProjectDir "tests") -v
}

function Show-SuccessSummary {
    Write-Host ""
    Write-Host "[backend-installer] Instalacion completada."
    Write-Host ""
    Write-Host "Siguientes comandos utiles:"
    Write-Host "  .\.venv\Scripts\activate"
    Write-Host "  python run.py"
    Write-Host ""
    Write-Host "Documentacion:"
    Write-Host "  $ProjectDir\README.md"
}

function Run-Backend {
    $venvPython = Join-Path $VenvDir "Scripts\python.exe"
    Write-Log "Levantando backend"
    & $venvPython (Join-Path $ProjectDir "run.py")
}

Set-Location $ProjectDir

Write-Log "Verificando herramientas requeridas"
Ensure-Command -CommandName $PythonCommand -InstallHint "Instala Python 3.11 o superior y vuelve a intentar."
Test-PythonVersion
Test-VenvSupport

if ($CheckOnly) {
    Write-Log "Verificacion completada. El sistema tiene los requisitos minimos para instalar el backend."
    exit 0
}

Create-VenvIfMissing
Install-Dependencies
Ensure-EnvFile

if (-not $SkipTests) {
    Run-BackendTests
}
else {
    Write-Log "Pruebas omitidas por opcion -SkipTests"
}

Show-SuccessSummary

if ($Run) {
    Run-Backend
}
