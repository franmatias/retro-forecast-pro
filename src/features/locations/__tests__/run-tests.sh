#!/bin/bash
# Script para ejecutar pruebas del módulo locations

echo "Ejecutando tests para el módulo Locations..."
cd ../../../../
npm run test -- --dir src/features/locations/__tests__ --config vitest.config.ts

echo ""
echo "Para ejecutar tests con coverage:"
echo "npm run test:coverage -- --dir src/features/locations/__tests__ --config vitest.config.ts"
