import http from 'http';
import fs from 'fs';
import CFG from './CFG.js';
import MIME_TYPES from './MIME_TYPES.js';
import { htmlMin } from '@jam-do/jam-tools/iso/htmlMin.js';
import { getImportMap } from '@jam-do/jam-tools/node/getImportMap.js';
import esbuild from 'esbuild';
import { ssr } from './ssr.js';
import pth from './pth.js';

const httpServer = http.createServer(async (req, res) => {

  console.log(`🚀 ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'text/plain');
    res.end('Unsupported request method: ' + req.method);
    return;
  }

  /** @type {Object<string, string>} */
  let ssrData = {};
  
  let fileName = req.url
    .split('/')
    .pop()
    .split('?')[0]
    .toLowerCase();

  if (fileName === 'index.js') {
    // Handle JS bundles:
    try {
      let entry = '.' + req.url;
      let js = esbuild.buildSync({
        entryPoints: [entry],
        bundle: true,
        format: 'esm',
        target: 'esnext',
        minify: true,
        sourcemap: false,
        external: ['@symbiotejs/symbiote', 'crypto'],
        treeShaking: true,
        write: false,
      }).outputFiles[0].text;
      res.setHeader('Content-Type', 'text/javascript');
      res.end(js);
    } catch (err) {
      console.log(err);
      res.setHeader('Content-Type', 'text/plain');
      res.end('JS BUNDLE ERROR');
    }
    return;
  } else if (fileName === 'index.css') { 
    // Handle CSS bundles:
    try {
      let entry = '.' + req.url;
      let css = esbuild.buildSync({
        entryPoints: [entry],
        bundle: true,
        minify: true,
        write: false,
      }).outputFiles[0].text;
      res.setHeader('Content-Type', 'text/css');
      res.end(css);
    } catch (err) {
      console.log(err);
      res.setHeader('Content-Type', 'text/plain');
      res.end('CSS BUNDLE ERROR');
    }
    return;
  } else if (req.url.split('/index.')[1]?.includes('.js')) {
    // Handle any DWA:
    try {
      let fileExt = req.url.split('/index.')[1].split('.js')[0].split('?')[0].toLowerCase();
      let fileTxt = (await import(pth(req.url) + '?' + Date.now())).default;
      res.setHeader('Content-Type', MIME_TYPES[fileExt]);
      res.end(await ssr(fileTxt, CFG.ssrComponents.templates, ssrData));
    } catch (err) {
      console.log(err);
      res.setHeader('Content-Type', 'text/plain');
      res.end('DWA IMPORT ERROR');
    }
    return;
  } else if (Object.keys(MIME_TYPES).find(type => req.url.includes('.' + type))) { 
    // Handle other static files:
    if (fs.existsSync('.' + req.url)) {
      let file = fs.readFileSync('.' + req.url);
      res.setHeader('Content-Type', MIME_TYPES[req.url.split('.')[1].split('?')[0].toLowerCase()]);
      res.end(file);
    } else {
      res.setHeader('Content-Type', 'text/plain');
      res.end('404');
    }
    return;
  }

  // Process routes:
  let route = req.url.split('?')[0];
  route.endsWith('/') || (route += '/');
  let routes = (await import(pth(CFG.routes))).default;
  let importMap = getImportMap(['@symbiotejs/symbiote']);
  ssrData.importMap = importMap;
  if (routes[route]) {
    try {
      let html = (await import(pth(routes[route]) + '?' + Date.now())).default;
      res.setHeader('Content-Type', 'text/html');
      res.end(htmlMin(await ssr(html, CFG.ssrComponents.templates, ssrData)));
    } catch (err) {
      console.log(err);
      res.setHeader('Content-Type', 'text/plain');
      res.end('DWA IMPORT ERROR');
      return;
    }
  } else {
    res.setHeader('Content-Type', 'text/plain');
    res.end('ERROR');
  }
});

httpServer.listen(CFG.port, () => {
  console.log(`✅ HTTP server started: http://localhost:${CFG.port}`);
});