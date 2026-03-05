const { SerialPort } = require('serialport');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class VexcomService {
  constructor() {
    this.connectedPort = null;
  }

  getVexcomPath() {
    const isPackaged = process.resourcesPath && !process.resourcesPath.includes('node_modules');

    if (isPackaged) {
      // Packaged app - look in resources
      const binary = process.platform === 'win32' ? 'vexcom.exe' : 'vexcom';
      return path.join(process.resourcesPath, binary);
    } else {
      // Development - look in project root
      const projectRoot = path.join(__dirname, '..', '..');
      const binary = process.platform === 'win32' ? 'vexcom.exe' : 'vexcom';
      // Check resources/ first, then project root
      const resourcesPath = path.join(projectRoot, 'resources', binary);
      const rootPath = path.join(projectRoot, binary);
      if (fs.existsSync(resourcesPath)) return resourcesPath;
      return rootPath;
    }
  }

  async scanForRobot() {
    try {
      const ports = await SerialPort.list();

      // Look for VEX devices by manufacturer, pnpId, or vendorId
      const vexPort = ports.find(port => {
        const info = JSON.stringify(port).toLowerCase();
        return info.includes('vex') || info.includes('2888');
      });

      if (vexPort) {
        this.connectedPort = vexPort.path;
        return {
          connected: true,
          port: vexPort.path,
          manufacturer: vexPort.manufacturer || 'VEX'
        };
      }

      this.connectedPort = null;
      return { connected: false };
    } catch (err) {
      // serialport may not be available (e.g., no native build)
      // Fall back to checking if vexcom can find the device
      this.connectedPort = null;
      return { connected: false, error: err.message };
    }
  }

  async uploadPython(code, slot = 1) {
    return new Promise((resolve, reject) => {
      // Write code to temp file
      const tmpDir = os.tmpdir();
      const tmpFile = path.join(tmpDir, 'vexcoder_upload.py');
      fs.writeFileSync(tmpFile, code, 'utf-8');

      const vexcomPath = this.getVexcomPath();

      if (!fs.existsSync(vexcomPath)) {
        reject(new Error("Can't find vexcom. Make sure it's in the project folder."));
        return;
      }

      // Build vexcom command args
      const args = ['--python', '--slot', String(slot), '--write', tmpFile, '--run'];
      if (this.connectedPort) {
        args.push(this.connectedPort);
      }

      // Ensure execute permission on macOS/Linux
      if (process.platform !== 'win32') {
        try { fs.chmodSync(vexcomPath, 0o755); } catch {}
      }

      const proc = spawn(vexcomPath, args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', (exitCode) => {
        // Clean up temp file
        try { fs.unlinkSync(tmpFile); } catch {}

        if (exitCode === 0) {
          resolve({ success: true, output: stdout });
        } else {
          const errorMsg = stderr || stdout || `vexcom exited with code ${exitCode}`;
          // Friendly error messages
          let friendlyMsg = errorMsg;
          if (errorMsg.includes('not found') || errorMsg.includes('no device')) {
            friendlyMsg = "Can't find your robot. Is it plugged in and turned on?";
          } else if (errorMsg.includes('permission') || errorMsg.includes('access')) {
            friendlyMsg = "Can't connect to the robot. Try unplugging and plugging it back in.";
          }
          resolve({ success: false, error: friendlyMsg });
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to run vexcom: ${err.message}`));
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        proc.kill();
        resolve({ success: false, error: 'Upload timed out. Try again.' });
      }, 30000);
    });
  }
}

module.exports = { VexcomService };
