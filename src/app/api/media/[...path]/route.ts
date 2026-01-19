// app/api/media/[...path]/route.ts
import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const [bucketName, ...filePathParts] = params.path;
  const path = filePathParts.join('/');

  if (!bucketName || !path) {
    return NextResponse.json({ error: 'Missing bucket or path' }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(bucketName)
    .download(path);

  if (error) {
    console.error(`Media fetch error (${bucketName}/${path}):`, error);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Detect MIME type
  const mimeType = path.toLowerCase().endsWith('.png')
    ? 'image/png'
    : path.toLowerCase().endsWith('.jpeg') || path.toLowerCase().endsWith('.jpg')
    ? 'image/jpeg'
    : path.toLowerCase().endsWith('.gif')
    ? 'image/gif'
    : 'image/webp';

  return new NextResponse(data, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}