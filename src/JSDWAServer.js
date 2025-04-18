import http from 'http';
import fs from 'fs';
import CFG from './CFG.js';
import MIME_TYPES from './MIME_TYPES.js';
import { htmlMin } from '@jam-do/jam-tools/iso/htmlMin.js';
import { getImportMap } from '@jam-do/jam-tools/node/getImportMap.js';
import esbuild from 'esbuild';
import { ssr } from './ssr.js';
import pth from './pth.js';

/** @type {Object<string, {type: string, content: string}>} */
const cache = Object.create(null);

export function createServer(options = {}) {
  // Override CFG with options
  if (options.cache !== undefined) {
    CFG.cache = options.cache;
  }
  if (options.port !== undefined) {
    CFG.port = options.port;
  }

  const httpServer = http.createServer(async (req, res) => {

    if (CFG.cache && cache[req.url]) {
      res.setHeader('Content-Type', cache[req.url].type);
      res.end(cache[req.url].content);
      return;
    }

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

    let params = CFG.cache ? '' : '?' + Date.now();

    let respond = (type, content) => {
      cache[req.url] = { type, content };
      res.setHeader('Content-Type', type);
      res.end(content);
    };

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
        respond('text/plain', 'JS BUNDLE ERROR');
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
        respond('text/plain', 'CSS BUNDLE ERROR');
      }
      return;
    } else if (req.url.split('/index.')[1]?.includes('.js')) {
      // Handle any DWA:
      try {
        let fileExt = req.url.split('/index.')[1].split('.js')[0].split('?')[0].toLowerCase();
        let dwaPath = pth(req.url, true);
        let fileTxt = (await import(dwaPath + params)).default;
        respond(MIME_TYPES[fileExt], await ssr(fileTxt, CFG.ssrComponents.templates, ssrData));
      } catch (err) {
        console.log(err);
        respond('text/plain', 'DWA IMPORT ERROR');
      }
      return;
    } else if (Object.keys(MIME_TYPES).find(type => req.url.includes('.' + type))) { 
      // Handle other static files:
      if (fs.existsSync('.' + req.url)) {
        let file = fs.readFileSync('.' + req.url);
        respond(MIME_TYPES[req.url.split('.')[1].split('?')[0].toLowerCase()], file);
      } else {
        respond('text/plain', '404');
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
        let html = (await import(pth(routes[route]) + params)).default;
        respond('text/html', htmlMin(await ssr(html, CFG.ssrComponents.templates, ssrData)));
      } catch (err) {
        console.log(err);
        respond('text/plain', 'DWA IMPORT ERROR');
        return;
      }
    } else {
      respond('text/plain', 'ERROR');
    }
  });

  httpServer.listen(CFG.port, () => {
    console.log(`✅ HTTP server started: http://localhost:${CFG.port}`);
  });

  return httpServer;
}
