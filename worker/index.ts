interface Env {
  ASSETS: Fetcher;
}

const API_ORIGIN = 'https://api-origin.patricioeevandria.com.br';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/') || url.pathname === '/health') {
      const upstreamUrl = new URL(url.pathname + url.search, API_ORIGIN);
      const upstreamRequest = new Request(upstreamUrl.toString(), request);

      return fetch(upstreamRequest);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;