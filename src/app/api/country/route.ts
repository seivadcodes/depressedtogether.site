// src/app/api/country/route.ts
export async function GET(request: Request) {
  // Vercel automatically adds this header in production
  const country = request.headers.get('x-vercel-ip-country') || 'US';
  return Response.json({ country });
}