import { getSharedTemplate } from "@/lib/shareStore";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const json = getSharedTemplate(id);
  if (!json) {
    return Response.json(
      { error: "Shared template not found or expired" },
      { status: 404 },
    );
  }
  return new Response(json, {
    headers: { "Content-Type": "application/json" },
  });
}
