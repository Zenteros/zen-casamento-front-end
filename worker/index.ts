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

      try {
        return await fetch(upstreamRequest);
      } catch {
        return new Response(
          JSON.stringify({
            statusCode: 502,
            error: 'Bad Gateway',
            message: 'Serviço temporariamente indisponível.',
          }),
          {
            status: 502,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Cache-Control': 'no-store',
            },
          },
        );
      }
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;