const PROXY_CONFIG = {
    "/api": {
        "target": "http://localhost:3000",
        "secure": false,
        "changeOrigin": true,
        "logLevel": "debug",
        "pathRewrite": {
            "^/api": ""
        },
        // Using onProxyRes to force response headers (Cache-Control) on the browser side.
        // This is more robust than setting request headers in JSON.
        "onProxyRes": function (proxyRes, req, res) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('Surrogate-Control', 'no-store');
        }
    },
    "/uploads": {
        "target": "http://localhost:3000",
        "secure": false,
        "changeOrigin": true,
        "logLevel": "debug"
    }
};

module.exports = PROXY_CONFIG;
