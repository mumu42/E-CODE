import { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.englishagent.app",
  appName: "English Agent",
  webDir: "dist",
  server: {
    androidScheme: "https",
    // 开发时可设置 CAPACITOR_SERVER_URL=http://<ip>:3000 进行真机热加载
    url: serverUrl,
    cleartext: serverUrl ? serverUrl.startsWith("http://") : false,
    allowNavigation: serverUrl ? [serverUrl] : undefined,
  },
  android: {
    // 仅在开发调试时启用；生产构建请移除或使用 HTTPS
    allowMixedContent: serverUrl?.startsWith("http://"),
  },
  ios: {
    contentInset: "always",
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#2563eb",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
