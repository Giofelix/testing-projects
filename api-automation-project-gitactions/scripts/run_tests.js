// scripts/run_tests.js - Versión corregida para Windows/Node.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=========================================');
console.log('🚀 Iniciando Ejecución de Pruebas API');
console.log('=========================================');

// Configuración
const config = {
    collection: 'collections/UserManagement.postman_collection.json',
    environment: 'environments/ReqRes_Practice.postman_environment.json',
    reporters: ['cli', 'htmlextra', 'json', 'junit']
};

// Crear timestamp
function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

// Directorio de reportes
const timestamp = getTimestamp();
const reportDir = path.join(__dirname, '..', 'reports', timestamp);

console.log('📊 Configuración:');
console.log(`   Colección: ${config.collection}`);
console.log(`   Environment: ${config.environment}`);
console.log(`   Reportes en: ${reportDir}`);
console.log('');

// Crear directorio si no existe
if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
    console.log(`✅ Directorio creado: ${reportDir}`);
}

// Construir comando Newman
function buildNewmanCommand() {
    const baseCommand = `npx newman run "${config.collection}"`;
    const envCommand = `-e "${config.environment}"`;
    
    // Reporters
    const reporters = config.reporters.join(',');
    let reporterCommands = `-r ${reporters}`;
    
    // Export paths para cada reporter
    const htmlReportPath = path.join(reportDir, 'report.html');
    const jsonReportPath = path.join(reportDir, 'report.json');
    const junitReportPath = path.join(reportDir, 'report.xml');
    
    reporterCommands += ` --reporter-htmlextra-export "${htmlReportPath}"`;
    reporterCommands += ` --reporter-json-export "${jsonReportPath}"`;
    reporterCommands += ` --reporter-junit-export "${junitReportPath}"`;
    
    // Opciones adicionales
    const options = '--delay-request 500 --verbose';
    
    return `${baseCommand} ${envCommand} ${reporterCommands} ${options}`;
}

// Ejecutar pruebas
try {
    console.log('🔄 Ejecutando pruebas Newman...');
    console.log('-----------------------------------------');
    
    const command = buildNewmanCommand();
    console.log(`Comando: ${command}\n`);
    
    // Ejecutar Newman
    execSync(command, { stdio: 'inherit', encoding: 'utf8' });
    
    console.log('\n=========================================');
    console.log('✅ TODAS LAS PRUEBAS PASARON');
    console.log('=========================================');
    
    // Copiar reporte como "latest"
    const latestReportPath = path.join(__dirname, '..', 'reports', 'latest.html');
    const htmlReportPath = path.join(reportDir, 'report.html');
    
    if (fs.existsSync(htmlReportPath)) {
        fs.copyFileSync(htmlReportPath, latestReportPath);
        console.log(`📁 Reporte HTML disponible en: ${htmlReportPath}`);
        console.log(`📁 Reporte latest: ${latestReportPath}`);
    }
    
    console.log('\n🎉 Proceso completado exitosamente!');
    process.exit(0);
    
} catch (error) {
    console.log('\n=========================================');
    console.log('❌ ALGUNAS PRUEBAS FALLARON');
    console.log('=========================================');
    
    if (error.status) {
        console.log(`Código de salida: ${error.status}`);
    }
    
    if (error.stdout) {
        console.log('\nOutput:', error.stdout.toString());
    }
    
    if (error.stderr) {
        console.log('\nErrores:', error.stderr.toString());
    }
    
    console.log('\n⚠️  Revisa los reportes para más detalles');
    process.exit(error.status || 1);
}