import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nemoneai.plants',
  appName: 'NEMONE PLANTS',
  webDir: 'public', // 라이브 웹사이트를 직접 띄우므로 빈 껍데기 폴더만 지정(맛매치/PACE와 동일)
  server: {
    url: 'https://plants.nemoneai.com', // 웹을 그대로 띄워 앱 재배포 없이 실시간 반영
    cleartext: true
  }
};

export default config;
