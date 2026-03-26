{
  "name": "nexaflow-client-deadshot",
  "version": "1.1.1",
  "description": "Premium high-performance NexaFlow Client for DeadShot.",
  "main": "src/app.js",
  "scripts": {
    "start": "electron .",
    "pack": "electron-builder --dir",
    "dist": "electron-builder",
    "publish": "electron-builder -p always"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/SIC-Corporation/Deadshot-Client.git"
  },
  "author": "Roy (SIC Corp)",
  "license": "MIT",
  "build": {
    "productName": "NexaFlow Client for DeadShot",
    "appId": "com.siccorp.nexaflow.deadshot",
    "compression": "normal",
    "asarUnpack": [
      "unpack"
    ],
    "publish": [
      {
        "provider": "github",
        "owner": "SIC-Corporation",
        "repo": "Deadshot-Client"
      }
    ],
    "files": [
      "unpack/**",
      "build/**",
      "src/**.js",
      "package.json"
    ],
    "directories": {
      "buildResources": "build",
      "output": "dist/${version}/${platform}/"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "runAfterFinish": false,
      "installerIcon": "build/icon.ico",
      "uninstallerIcon": "build/icon.ico"
    }
  },
  "devDependencies": {
    "electron": "^20.1.1",
    "electron-builder": "^23.3.3"
  },
  "dependencies": {
    "discord-rpc": "^4.0.1",
    "electron-is-dev": "^2.0.0",
    "electron-localshortcut": "^3.2.1"
  }
}
