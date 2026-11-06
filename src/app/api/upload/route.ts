import { actor, requireRole } from '@/lib/session';
import { storeImage } from '@/lib/integrations/storage';
export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== new URL(req.url).origin)
      return Response.json({ error: 'Otillåtet ursprung.' }, { status: 403 });
    const a = await actor();
    requireRole(a, 'seller', 'admin');
    if (Number(req.headers.get('content-length') || 0) > 2100000) throw Error('Filen är för stor.');
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw Error('Välj en bild.');
    return Response.json(await storeImage(file, a.workspaceId));
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Uppladdningen misslyckades.' },
      { status: 400 },
    );
  }
}
