import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CLOUD_APK_BASE = 'https://pwabuilder-cloudapk.azurewebsites.net';

const payload = {
  host: 'https://fleet-control-liard.vercel.app',
  pwaUrl: 'https://fleet-control-liard.vercel.app',
  webManifestUrl: 'https://fleet-control-liard.vercel.app/manifest.webmanifest',
  name: 'NBAPARK - Controle de Frota',
  launcherName: 'NBAPARK Frota',
  packageId: 'com.nbapark.fleetcontrol',
  appVersion: '1.0.0',
  appVersionCode: 1,
  themeColor: '#1D428A',
  themeColorDark: '#0d1117',
  navigationColor: '#1D428A',
  navigationColorDark: '#1D428A',
  backgroundColor: '#1D428A',
  startUrl: '/',
  display: 'standalone',
  orientation: 'portrait',
  iconUrl: 'https://fleet-control-liard.vercel.app/pwa-512x512.png',
  maskableIconUrl: 'https://fleet-control-liard.vercel.app/pwa-512x512.png',
  splashScreenFadeOutDuration: 300,
  enableSiteSettingsShortcut: true,
  enableNotifications: true,
  fallbackType: 'customtabs',
  features: {
    locationDelegation: {
      enabled: true
    },
    playBilling: {
      enabled: false
    }
  },
  signingMode: 'new',
  signing: {
    file: null,
    alias: 'nbapark-key',
    fullName: 'NBAPARK Frota',
    organization: 'NBAPARK',
    organizationalUnit: 'Frota',
    countryCode: 'BR',
    keyPassword: 'nbaparkpassword123',
    storePassword: 'nbaparkpassword123'
  },
  includeSourceCode: false
};

async function generateApk() {
  console.log('🚀 [1/4] Enviando solicitação de empacotamento para o CloudAPK (PWABuilder)...');
  console.log(`URL do App: ${payload.host}`);
  console.log(`Package ID: ${payload.packageId}`);

  const enqueueRes = await fetch(`${CLOUD_APK_BASE}/enqueuePackageJob`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'platform-identifier': 'ServerUI',
      'platform-identifier-version': '1.0.0'
    },
    body: JSON.stringify(payload)
  });

  if (!enqueueRes.ok) {
    const errorText = await enqueueRes.text();
    throw new Error(`Falha ao iniciar o job no CloudAPK: ${enqueueRes.status} - ${errorText}`);
  }

  const { id: jobId, accessToken } = await enqueueRes.json();
  console.log(`✅ Job enfileirado com sucesso! ID: ${jobId}`);
  console.log('⏳ [2/4] Compilando APK no servidor de build do Android...');

  const startTime = Date.now();
  let completed = false;
  let printedLogs = new Set();

  while (!completed) {
    await new Promise(r => setTimeout(r, 3000));
    const statusRes = await fetch(`${CLOUD_APK_BASE}/getPackageJob?id=${encodeURIComponent(jobId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!statusRes.ok) {
      console.warn(`Aviso: status HTTP ${statusRes.status} ao checar progresso`);
      continue;
    }

    const job = await statusRes.json();

    if (Array.isArray(job.logs)) {
      for (const line of job.logs) {
        if (!printedLogs.has(line)) {
          printedLogs.add(line);
          console.log(`   [Build] ${line}`);
        }
      }
    }

    if (job.status === 'Completed') {
      completed = true;
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`🎉 [3/4] Compilação concluída com sucesso em ${duration}s!`);
    } else if (job.status === 'Failed') {
      throw new Error(`O build do APK falhou no servidor CloudAPK.`);
    } else {
      process.stdout.write('.');
    }
  }

  console.log('\n📥 [4/4] Baixando pacote APK gerado...');
  const zipRes = await fetch(`${CLOUD_APK_BASE}/downloadPackageZip?id=${encodeURIComponent(jobId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!zipRes.ok) {
    throw new Error(`Falha ao baixar o arquivo zip: ${zipRes.statusText}`);
  }

  const arrayBuffer = await zipRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const outputDir = path.resolve(process.cwd(), 'android-apk');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const zipPath = path.join(outputDir, 'app-package.zip');
  fs.writeFileSync(zipPath, buffer);
  console.log(`💾 Pacote salvo em: ${zipPath} (${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`);

  // Extrair o zip no Windows usando PowerShell
  console.log('📦 Extraindo arquivos do pacote...');
  try {
    execSync(`powershell.exe -Command "Expand-Archive -Force -Path '${zipPath}' -DestinationPath '${outputDir}'"`);
    console.log('✅ Pacote extraído com sucesso!');

    // Procurar arquivos .apk na pasta
    const files = fs.readdirSync(outputDir);
    console.log('📂 Arquivos gerados no diretório:', files);

    // Encontrar o .apk e renomear para NBAPARK-Frota.apk na raiz do projeto
    const apkFile = files.find(f => f.endsWith('.apk'));
    if (apkFile) {
      const sourceApk = path.join(outputDir, apkFile);
      const targetApk = path.resolve(process.cwd(), 'NBAPARK-Frota.apk');
      fs.copyFileSync(sourceApk, targetApk);
      console.log(`\n=================================================`);
      console.log(`📱 APK PRONTO PARA INSTALAÇÃO:`);
      console.log(`👉 ${targetApk}`);
      console.log(`=================================================`);
    }
  } catch (err) {
    console.warn('Nota sobre extração:', err.message);
  }
}

generateApk().catch(err => {
  console.error('\n❌ Erro durante geração do APK:', err);
  process.exit(1);
});
