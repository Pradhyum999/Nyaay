export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, Origin, X-Requested-With, *',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    const url = new URL(request.url);
    let targetBase = '';
    let targetPath = url.pathname + url.search;

    if (url.pathname.startsWith('/api/nvidia')) {
      targetBase = 'https://integrate.api.nvidia.com';
      targetPath = targetPath.replace(/^\/api\/nvidia/, '');
    } else {
      targetBase = 'https://webapi.ecourtsindia.com';
      if (targetPath.startsWith('/api/ecourts')) {
        targetPath = targetPath.replace(/^\/api\/ecourts/, '');
      }
    }

    const targetUrl = targetBase + targetPath;
    const auth = request.headers.get('Authorization') || request.headers.get('authorization');
    const contentType = request.headers.get('Content-Type') || 'application/json';

    const reqHeaders = {
      'Authorization': auth || '',
      'Content-Type': contentType,
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    let body = undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.arrayBuffer();
    }

    const upstreamRes = await fetch(targetUrl, {
      method: request.method,
      headers: reqHeaders,
      body,
    });

    const responseBody = await upstreamRes.arrayBuffer();
    const newHeaders = new Headers();
    upstreamRes.headers.forEach((val, key) => {
      if (!key.toLowerCase().startsWith('access-control-')) {
        newHeaders.set(key, val);
      }
    });
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, Origin, X-Requested-With, *');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    return new Response(responseBody, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: newHeaders,
    });
  }
};
