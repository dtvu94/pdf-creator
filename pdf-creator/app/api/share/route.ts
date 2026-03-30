import { saveSharedTemplate } from "@/lib/shareStore";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.text();
    // Basic validation — must be valid JSON with a pages array
    const parsed = JSON.parse(body);
    if (!parsed.pages || !Array.isArray(parsed.pages)) {
      return Response.json({ error: "Invalid template: missing pages array" }, { status: 400 });
    }
    const id = saveSharedTemplate(body);
    return Response.json({ id });
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
