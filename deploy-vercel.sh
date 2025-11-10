#!/bin/bash
set -e

echo "🚀 Script de Deploy Automático para Cobrolox en Vercel"
echo "========================================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar autenticación
echo -e "${BLUE}📋 Paso 1: Verificando autenticación...${NC}"
if ! vercel whoami > /dev/null 2>&1; then
    echo -e "${RED}❌ No estás autenticado. Ejecutando login...${NC}"
    vercel login
fi

echo -e "${GREEN}✓ Autenticación exitosa${NC}"
echo ""

# Variables de entorno desde .env.local
echo -e "${BLUE}📋 Paso 2: Leyendo variables de entorno...${NC}"
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: No se encuentra .env.local${NC}"
    exit 1
fi

# Extraer variables
DATABASE_URL=$(grep "^DATABASE_URL=" .env.local | cut -d '=' -f2- | tr -d '"')
DIRECT_URL=$(grep "^DIRECT_URL=" .env.local | cut -d '=' -f2- | tr -d '"')
BETTER_AUTH_SECRET=$(grep "^BETTER_AUTH_SECRET=" .env.local | cut -d '=' -f2- | tr -d '"')

echo -e "${GREEN}✓ Variables cargadas${NC}"
echo ""

# Vincular/crear proyecto
echo -e "${BLUE}📋 Paso 3: Vinculando proyecto con Vercel...${NC}"
vercel link --yes || vercel

echo -e "${GREEN}✓ Proyecto vinculado${NC}"
echo ""

# Configurar variables de entorno en Vercel
echo -e "${BLUE}📋 Paso 4: Configurando variables de entorno en Vercel...${NC}"

vercel env add DATABASE_URL production <<< "$DATABASE_URL" 2>/dev/null || echo "DATABASE_URL ya existe"
vercel env add DATABASE_URL preview <<< "$DATABASE_URL" 2>/dev/null || echo "DATABASE_URL preview ya existe"

vercel env add DIRECT_URL production <<< "$DIRECT_URL" 2>/dev/null || echo "DIRECT_URL ya existe"
vercel env add DIRECT_URL preview <<< "$DIRECT_URL" 2>/dev/null || echo "DIRECT_URL preview ya existe"

vercel env add BETTER_AUTH_SECRET production <<< "$BETTER_AUTH_SECRET" 2>/dev/null || echo "BETTER_AUTH_SECRET ya existe"
vercel env add BETTER_AUTH_SECRET preview <<< "$BETTER_AUTH_SECRET" 2>/dev/null || echo "BETTER_AUTH_SECRET preview ya existe"

echo -e "${GREEN}✓ Variables de entorno configuradas${NC}"
echo ""

# Deploy a producción
echo -e "${BLUE}📋 Paso 5: Desplegando a producción...${NC}"
vercel --prod

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 ¡Deploy completado exitosamente!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Para ver tu proyecto:"
echo "  vercel ls"
echo ""
echo "Para ver logs:"
echo "  vercel logs"
