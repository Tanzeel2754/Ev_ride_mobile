const { getDefaultConfig } = require('expo/metro-config');
const https = require('https');
const { URL } = require('url');

const AZURE_ORIGIN =
  'https://evrides-exaabxfrcdefc9dh.southeastasia-01.azurewebsites.net';
const PROXY_PREFIX = '/__api';

const config = getDefaultConfig(__dirname);
const originalEnhance = config.server?.enhanceMiddleware;

function corsHeaders(req) {
  return {
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers':
      req.headers['access-control-request-headers'] ||
      'Authorization,Content-Type,Accept',
    'Access-Control-Max-Age': '86400',
  };
}

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, metroServer) => {
    const inner = originalEnhance
      ? originalEnhance(middleware, metroServer)
      : middleware;

    return (req, res, next) => {
      if (!req.url?.startsWith(PROXY_PREFIX)) {
        return inner(req, res, next);
      }

      if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders(req));
        res.end();
        return;
      }

      const targetPath = req.url.slice(PROXY_PREFIX.length) || '/';
      const target = new URL(targetPath, AZURE_ORIGIN);
      const headers = { ...req.headers };
      delete headers.host;
      delete headers.origin;
      delete headers.referer;
      delete headers.connection;
      headers.host = target.host;

      const proxyReq = https.request(
        {
          protocol: target.protocol,
          hostname: target.hostname,
          port: target.port || 443,
          path: `${target.pathname}${target.search}`,
          method: req.method,
          headers,
        },
        (proxyRes) => {
          const outHeaders = {
            ...proxyRes.headers,
            ...corsHeaders(req),
          };
          res.writeHead(proxyRes.statusCode || 502, outHeaders);
          proxyRes.pipe(res);
        },
      );

      proxyReq.on('error', (err) => {
        res.writeHead(502, {
          'Content-Type': 'application/json',
          ...corsHeaders(req),
        });
        res.end(
          JSON.stringify({
            message: `Proxy error: ${err.message}`,
          }),
        );
      });

      req.pipe(proxyReq);
    };
  },
};

module.exports = config;
