
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateCertificate() {
    const certDir = path.join(__dirname, '..', 'cert');
    
    // crear directorio cert si no existe
    if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
        console.log(' Directorio cert/ creado');
    }
    
    const keyPath = path.join(certDir, 'server.key');
    const certPath = path.join(certDir, 'server.cert');
    
    // verificar si ya existen
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        console.log(' Los certificados ya existen');
        console.log('   Si quieres regenerarlos, elimina src/cert/ primero');
        return;
    }
    
    console.log('🔐 Generando certificado SSL autofirmado...');
    
    try {
        const command = `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=ES/ST=Madrid/L=Madrid/O=Producto4/CN=localhost"`;
        
        await execAsync(command);
        
        console.log('✅ Certificado generado exitosamente');
        console.log('');
        console.log('Archivos creados:');
        console.log(`  - ${keyPath}`);
        console.log(`  - ${certPath}`);
        console.log('');
        console.log('📝 Ahora configura tu .env:');
        console.log('   USE_HTTPS=true');
        console.log('   HTTPS_PORT=4443');
        console.log('');
        console.log('🚀 Inicia el servidor con: npm run dev');
        
    } catch (error) {
        if (error.message.includes('openssl')) {
            console.error('ERROR: OpenSSL no está instalado');
            console.log('');
            console.log('Soluciones:');
            console.log('');
            console.log('WINDOWS:');
            console.log('  1. Instala Git Bash desde https://git-scm.com/');
            console.log('  2. Ejecuta este script desde Git Bash');
            console.log('  O instala OpenSSL desde https://slproweb.com/products/Win32OpenSSL.html');
            console.log('');
            console.log('MAC:');
            console.log('  OpenSSL ya viene instalado');
            console.log('');
            console.log('LINUX:');
            console.log('  sudo apt-get install openssl');
        } else {
            console.error('Error generando certificado:', error.message);
        }
    }
}

generateCertificate();