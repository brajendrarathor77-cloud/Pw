const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Static files
app.use('/static', express.static(path.join(__dirname, 'public', 'static')));

// API Proxy (Penpencil)
app.use('/pw-api', createProxyMiddleware({
  target: 'https://api.penpencil.co',
  changeOrigin: true,
  pathRewrite: {'^/pw-api': ''},
  onProxyRes: function(proxyRes) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  }
}));

// Page Proxy for dynamic DRM player & quizzes from the original site
app.get(['/schedule-details', '/media/*', '/get-dpp-quiz', '/get-batch-test'], async (req, res) => {
    try {
        const targetUrl = `https://stream.testuk.org${req.url}`;
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Accept': 'text/html,application/xhtml+xml'
            }
        });
        let html = await response.text();
        const authScript = `<script>(function(){var e=localStorage.getItem('asm_access_expiry');if(!e||Date.now()>parseInt(e)){localStorage.removeItem('asm_access_expiry');window.location.href='/get-access';return;}})();</script>`;
        if (html.includes('<head>')) {
            html = html.replace('<head>', `<head>\n${authScript}`);
        } else {
            html = authScript + html;
        }
        html = html.replace(/<title>(.*?)vedstudy<\/title>/gi, '<title>$1Mod Galaxy</title>');
        res.setHeader('Content-Type', 'text/html');
        res.status(response.status).send(html);
    } catch(e) {
        res.status(500).send('Error proxying page');
    }
});

// Page routes — map clean URLs to HTML files
const pages = {
  '/':                  'home.html',
  '/batches':           'home.html',
  '/subjects':          'subjects.html',
  '/content':           'content.html',
  '/stream':            'stream.html',
  '/get-access':        'get-access.html',
  '/khazana':           'khazana.html',
  '/reset-key':         'get-access.html',
};

Object.entries(pages).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', file));
  });
});

// VPLINK proxy
app.get('/api/vplink', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing url parameter' });

  const API_TOKEN = 'bb0082e0ede156f2a39bf274f943aa567155b660';
  try {
    const r = await fetch(`https://vplink.in/api?api=${API_TOKEN}&url=${encodeURIComponent(targetUrl)}`);
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'VPLINK request failed', detail: err.message });
  }
});

// Local dev server execution
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n  ⚡ As Multiverse dev server running at http://localhost:${PORT}\n`);
  });
}

// Export app for Vercel Serverless Function
module.exports = app;
