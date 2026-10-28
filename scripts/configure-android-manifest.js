import fs from 'fs';
import path from 'path';

const manifestPath = path.resolve(
  process.cwd(),
  'src-tauri/gen/android/app/src/main/AndroidManifest.xml'
);

if (!fs.existsSync(manifestPath)) {
  console.log(`[configure-android] AndroidManifest.xml ainda não existe em: ${manifestPath}`);
  console.log('Execute `npx tauri android init` primeiro.');
  process.exit(0);
}

let content = fs.readFileSync(manifestPath, 'utf8');

const permissions = [
  'android.permission.INTERNET',
  'android.permission.ACCESS_NETWORK_STATE',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_BACKGROUND_LOCATION',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_LOCATION',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.WAKE_LOCK'
];

let permissionsXml = '';
permissions.forEach(perm => {
  if (!content.includes(perm)) {
    permissionsXml += `    <uses-permission android:name="${perm}" />\n`;
  }
});

if (permissionsXml) {
  content = content.replace('<application', `${permissionsXml}\n    <application`);
}

// Permitir tráfego de rede e HTTPS sem bloqueio de segurança local
if (!content.includes('android:usesCleartextTraffic')) {
  content = content.replace('<application', '<application android:usesCleartextTraffic="true"');
}

fs.writeFileSync(manifestPath, content, 'utf8');
console.log('✅ AndroidManifest.xml configurado com permissões de GPS, Notificações e tráfego de rede!');
