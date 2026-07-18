const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración del proyecto...\n');

const checks = [
  {
    name: 'Estructura de carpetas',
    check: () => {
      const requiredDirs = ['collections', 'environments', 'scripts', 'reports'];
      const missing = requiredDirs.filter(dir => !fs.existsSync(dir));
      return missing.length === 0 
        ? { ok: true, message: '✅ Todas las carpetas existen' }
        : { ok: false, message: `❌ Faltan: ${missing.join(', ')}` };
    }
  },
  {
    name: 'Archivo package.json',
    check: () => {
      if (!fs.existsSync('package.json')) return { ok: false, message: '❌ package.json no encontrado' };
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.name && pkg.version
        ? { ok: true, message: `✅ ${pkg.name} v${pkg.version}` }
        : { ok: false, message: '❌ package.json incompleto' };
    }
  },
  {
    name: 'Dependencias Newman',
    check: () => {
      try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const hasNewman = pkg.devDependencies && pkg.devDependencies.newman;
        return hasNewman
          ? { ok: true, message: '✅ Newman instalado' }
          : { ok: false, message: '❌ Newman no en devDependencies' };
      } catch { return { ok: false, message: '❌ Error leyendo package.json' }; }
    }
  },
  {
    name: 'Archivo .gitignore',
    check: () => {
      if (!fs.existsSync('.gitignore')) return { ok: false, message: '❌ .gitignore no encontrado' };
      const content = fs.readFileSync('.gitignore', 'utf8');
      const hasNodeModules = content.includes('node_modules');
      const hasReports = content.includes('reports/');
      return hasNodeModules && hasReports
        ? { ok: true, message: '✅ .gitignore configurado correctamente' }
        : { ok: false, message: '❌ .gitignore incompleto' };
    }
  }
];

let allPassed = true;
checks.forEach(item => {
  const result = item.check();
  console.log(`${item.name.padEnd(25)}: ${result.message}`);
  if (!result.ok) allPassed = false;
});

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('🎉 ¡Configuración completa! El proyecto está listo.');
} else {
  console.log('⚠️  Hay problemas en la configuración. Revisa los errores.');
}
console.log('='.repeat(50));