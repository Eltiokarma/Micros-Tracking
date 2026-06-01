#!/bin/bash
# SessionStart hook: instala dependencias para que lint y tests funcionen
# en las sesiones de Claude Code on the web, sin configuracion manual.
set -euo pipefail

# Solo en el entorno remoto (Claude Code on the web). En local no hace falta.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# npm install (no 'ci') para aprovechar el cache del contenedor entre sesiones.
echo "[session-start] Instalando dependencias con npm install..."
npm install --no-audit --no-fund

echo "[session-start] Dependencias listas."
