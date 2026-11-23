import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, 'public/uploads');

// Start Laravel artisan serve on port 8001
console.log('🚀 Menjalankan Laravel di port 8001...');
const laravel = spawn('php', ['artisan', 'serve', '--port=8001'], {
  cwd: __dirname,
  stdio: 'inherit',
});

laravel.on('error', (err) => {
  console.error('❌ Gagal menjalankan Laravel:', err.message);
});

laravel.on('close', (code) => {
  console.log(`Laravel berhenti dengan kode ${code}`);
  process.exit(code || 0);
});

// Clean shutdown for child process (including on Windows)
const cleanup = () => {
  if (laravel && laravel.pid) {
    if (process.platform === 'win32') {
      try {
        spawn('taskkill', ['/pid', laravel.pid.toString(), '/T', '/F']);
      } catch (e) {}
    } else {
      try {
        laravel.kill('SIGTERM');
      } catch (e) {}
    }
  }
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

const server = http.createServer((req, res) => {
  // If request is for /uploads/...
  if (req.url && req.url.startsWith('/uploads/')) {
    const filename = req.url.replace('/uploads/', '').split('?')[0];
    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
      };
      const contentType = contentTypes[ext] || 'application/octet-stream';
      const stat = fs.statSync(filePath);

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stat.size,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  // Forward everything else to Laravel on port 8001
  const options = {
    hostname: '127.0.0.1',
    port: 8001,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'Laravel backend belum siap atau tidak terjangkau di port 8001' }));
  });

  req.pipe(proxyReq);
});

server.listen(8000, '0.0.0.0', () => {
  console.log('⚡ Gateway aktif di port 8000 (Proxy -> Laravel Port 8001, Uploads langsung dari disk)');
});
