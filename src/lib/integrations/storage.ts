import { put } from '@vercel/blob';
import { db } from '../db';
export async function storeImage(file: File, workspaceId: string) {
  if (file.size > 2 * 1024 * 1024) throw Error('Bilden får vara högst 2 MB.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw Error('Välj en JPEG-, PNG- eller WebP-bild.');
  const bytes = Buffer.from(await file.arrayBuffer());
  const valid =
    file.type === 'image/jpeg'
      ? bytes[0] === 255 && bytes[1] === 216
      : file.type === 'image/png'
        ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!valid) throw Error('Bildens filformat stämmer inte.');
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(
      `nordmark/${workspaceId}/${crypto.randomUUID()}.${file.type.split('/')[1]}`,
      bytes,
      { access: 'public', contentType: file.type },
    );
    return { url: blob.url, provider: 'vercel-blob' };
  }
  const media = await db.media.create({ data: { workspaceId, data: bytes, mime: file.type } });
  return { url: `/api/images/${media.id}`, provider: 'demo-postgres' };
}
