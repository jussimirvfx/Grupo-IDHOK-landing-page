import { createConversionHandler } from '../api/meta/conversions.js';

export function metaConversionsDevPlugin(environment) {
  const handler = createConversionHandler({ environment });
  return {
    name: 'meta-conversions-dev',
    configureServer(server) {
      server.middlewares.use('/api/meta/conversions', async (req, res) => {
        let body = '';
        for await (const chunk of req) {
          body += chunk.toString();
          if (Buffer.byteLength(body) > 65_536) {
            res.statusCode = 413;
            res.end(JSON.stringify({ success: false, error: 'payload-too-large' }));
            return;
          }
        }
        req.body = body;
        const response = {
          setHeader: (key, value) => res.setHeader(key, value),
          status(code) { res.statusCode = code; return this; },
          json(data) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); return this; },
          end: () => res.end(),
        };
        await handler(req, response);
      });
    },
  };
}
