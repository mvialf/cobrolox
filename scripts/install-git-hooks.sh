#!/bin/bash

# Script para instalar git hooks de seguridad
# Ejecutar después de clonar el repositorio: bash scripts/install-git-hooks.sh

set -e

HOOKS_DIR="scripts/git-hooks"
GIT_HOOKS_DIR=".git/hooks"

echo "📦 Instalando git hooks de seguridad..."

# Verificar que estamos en un repositorio git
if [ ! -d ".git" ]; then
  echo "❌ Error: No estás en la raíz de un repositorio git"
  exit 1
fi

# Copiar hooks
for hook_file in "$HOOKS_DIR"/*; do
  if [ -f "$hook_file" ]; then
    hook_name=$(basename "$hook_file")
    echo "  → Instalando $hook_name"
    cp "$hook_file" "$GIT_HOOKS_DIR/$hook_name"
    chmod +x "$GIT_HOOKS_DIR/$hook_name"
  fi
done

echo ""
echo "✅ Git hooks instalados correctamente"
echo ""
echo "Hooks instalados:"
echo "  - pre-commit: Previene commit de archivos .env* (excepto .env.example)"
echo ""
echo "💡 Estos hooks protegen contra filtración accidental de secretos."
