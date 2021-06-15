const {
  app,
  dialog,
  ipcMain
} = require('electron');
const child_process = require('child_process');
const appRoot = require('app-root-path');
const path = require('path');
const fs = require('fs');
const os = require('os');


class Gtsf {
  constructor() {
    this.isRunning = false;
    this.gtsfProcess = null;
    this.logGtsfEvents = false;
    // create the user data dir (needed for MacOS)
    if (!fs.existsSync(app.getPath('userData'))) {
      fs.mkdirSync(app.getPath('userData'));
    }
    if (this.logGtsfEvents) {
      this.logStream = fs.createWriteStream(path.join(app.getPath("userData"), "gethlog.txt"), {
        flags: "a"
      });
    }

    if (appRoot.path.indexOf('app.asar') > -1) {
      this.rootPath = path.dirname(appRoot.path);
    } else {
      this.rootPath = appRoot.path;
    }

    switch (os.type()) {
      case "Linux":
        this.binaries = path.join(this.rootPath, 'bin', 'linux');
        break;
      case "Darwin":
        this.binaries = path.join(this.rootPath, 'bin', 'macos');
        break;
      case "Windows_NT":
        this.binaries = path.join(this.rootPath, 'bin', 'win');
        break;
      default:
        this.binaries = path.join(this.rootPath, 'bin', 'win');
    }


  }

  _writeLog(text) {
    if (this.logGtsfEvents) {
      this.logStream.write(text);
    }
  }

  startGtsf() {
    // get the path of get and execute the child process
    try {
      this.isRunning = true;
      const gtsfPath = path.join(this.binaries, 'gtsf');
      this.gtsfProcess = child_process.spawn(gtsfPath, ['--ws', '--wsorigins', '*', '--wsaddr', '127.0.0.1', '--wsport', '4950', '--wsapi', 'admin,db,eth,net,miner,personal,web3']);

      if (!this.gtsfProcess) {
        dialog.showErrorBox("Error starting application", "gtsf failed to start!");
        app.quit();
      } else {
        this.gtsfProcess.on('error', function (err) {
          dialog.showErrorBox("Error starting application", "gtsf failed to start!");
          app.quit();
        });
        this.gtsfProcess.on("close", function (err) {
          if (this.isRunning) {
            dialog.showErrorBox("Error running the node", "The node stoped working. Wallet will close!");
            app.quit();
          }
        });
        this.gtsfProcess.stderr.on('data', function (data) {
          TSFGtsf._writeLog(data.toString() + '\n');
        });
        this.gtsfProcess.stdout.on('data', function (data) {
          TSFGtsf._writeLog(data.toString() + '\n');
        });
      }
    } catch (err) {
      dialog.showErrorBox("Error starting application", err.message);
      app.quit();
    }
  }

  stopGtsf() {
    // if (os.type() == "Windows_NT") {
    //   const gtsfWrapePath = path.join(this.binaries, 'WrapGtsf.exe');
    //   child_process.spawnSync(gtsfWrapePath, [this.gtsfProcess.pid]);
    // } else {
    //   this.gtsfProcess.kill('SIGTERM');
    // }
    this.gtsfProcess.kill('SIGTERM');
  }
}

ipcMain.on('stopGtsf', (event, arg) => {
  TSFGtsf.stopGtsf();
});

TSFGtsf = new Gtsf();