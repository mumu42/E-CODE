/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * @file scripts/get-ip.js
 * @description 获取本机局域网 IP，用于 Capacitor 真机调试
 * @author English Agent Team
 * @date 2026-08-25
 */

const os = require("os");

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

console.log(getLocalIp());
