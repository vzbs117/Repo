#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="${PROJECT_DIR}/.venv"
PYTHON_BIN="${PYTHON_BIN:-python3}"
CHECK_ONLY=false
RUN_TESTS=true
RUN_SERVER=false

print_help() {
  cat <<'EOF'
Uso:
  bash install_backend.sh [opciones]

Opciones:
  --check-only   Solo verifica requisitos, no instala nada.
  --skip-tests   Omite las pruebas al final de la instalacion.
  --run          Levanta el backend al terminar la instalacion.
  --help         Muestra esta ayuda.
EOF
}

log() {
  printf '\n[backend-installer] %s\n' "$1"
}

warn() {
  printf '\n[backend-installer] AVISO: %s\n' "$1"
}

fail() {
  printf '\n[backend-installer] ERROR: %s\n' "$1" >&2
  exit 1
}

for arg in "$@"; do
  case "$arg" in
    --check-only)
      CHECK_ONLY=true
      ;;
    --skip-tests)
      RUN_TESTS=false
      ;;
    --run)
      RUN_SERVER=true
      ;;
    --help)
      print_help
      exit 0
      ;;
    *)
      fail "Opcion no reconocida: ${arg}. Usa --help para ver opciones."
      ;;
  esac
done

check_command() {
  local command_name="$1"
  local install_hint="$2"

  if ! command -v "${command_name}" >/dev/null 2>&1; then
    fail "No se encontro '${command_name}'. ${install_hint}"
  fi
}

check_python_version() {
  local version_output

  version_output="$("${PYTHON_BIN}" - <<'PY'
import sys

minimum = (3, 11)
current = sys.version_info[:3]
if current < minimum:
    raise SystemExit(
        f"Python {minimum[0]}.{minimum[1]} o superior es requerido. Version detectada: "
        f"{current[0]}.{current[1]}.{current[2]}"
    )
print(f"{current[0]}.{current[1]}.{current[2]}")
PY
)"

  log "Python detectado: ${version_output}"
}

check_venv_support() {
  "${PYTHON_BIN}" -m venv --help >/dev/null 2>&1 || fail \
    "Tu instalacion de Python no tiene soporte para venv. Instala el paquete de venv correspondiente y vuelve a intentar."
}

create_venv_if_missing() {
  if [[ -d "${VENV_DIR}" ]]; then
    log "Entorno virtual encontrado en ${VENV_DIR}"
    return
  fi

  log "Creando entorno virtual en ${VENV_DIR}"
  "${PYTHON_BIN}" -m venv "${VENV_DIR}"
}

install_dependencies() {
  log "Actualizando pip"
  if ! "${VENV_DIR}/bin/python" -m pip install --upgrade pip; then
    warn "No se pudo actualizar pip. Continuare con la instalacion usando la version disponible."
  fi

  log "Instalando dependencias del backend"
  "${VENV_DIR}/bin/pip" install -r "${PROJECT_DIR}/requirements.txt"
}

ensure_env_file() {
  if [[ -f "${PROJECT_DIR}/.env" ]]; then
    log "Archivo .env existente detectado"
    return
  fi

  log "Creando .env desde .env.example"
  cp "${PROJECT_DIR}/.env.example" "${PROJECT_DIR}/.env"
}

run_backend_tests() {
  log "Ejecutando pruebas del backend"
  "${VENV_DIR}/bin/python" -m unittest discover -s "${PROJECT_DIR}/tests" -v
}

show_success_summary() {
  cat <<EOF

[backend-installer] Instalacion completada.

Siguientes comandos utiles:
  source .venv/bin/activate
  python run.py

Documentacion:
  ${PROJECT_DIR}/README.md
EOF
}

run_backend() {
  log "Levantando backend"
  exec "${VENV_DIR}/bin/python" "${PROJECT_DIR}/run.py"
}

main() {
  cd "${PROJECT_DIR}"

  log "Verificando herramientas requeridas"
  check_command "${PYTHON_BIN}" "Instala Python 3.11 o superior y vuelve a intentar."
  check_python_version
  check_venv_support

  if [[ "${CHECK_ONLY}" == true ]]; then
    log "Verificacion completada. El sistema tiene los requisitos minimos para instalar el backend."
    exit 0
  fi

  create_venv_if_missing
  install_dependencies
  ensure_env_file

  if [[ "${RUN_TESTS}" == true ]]; then
    run_backend_tests
  else
    log "Pruebas omitidas por opcion --skip-tests"
  fi

  show_success_summary

  if [[ "${RUN_SERVER}" == true ]]; then
    run_backend
  fi
}

main "$@"
