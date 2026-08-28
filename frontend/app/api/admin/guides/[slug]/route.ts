import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";
const ADMIN_SECRET = process.env.PLANTS_ADMIN_SECRET;

interface Params {
  params: Promise<{ slug: string }>;
}

async function proxy(method: string, slug: string, body?: string) {
  const res = await fetch(`${BACKEND_URL}/api/admin/guides/${slug}`, {
    method,
    headers: { "Content-Type": "application/json", "x-plants-admin-secret": ADMIN_SECRET ?? "" },
    body,
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "관리자 인증 실패" }, { status: 403 });
  const { slug } = await params;
  return proxy("PUT", slug, await req.text());
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "관리자 인증 실패" }, { status: 403 });
  const { slug } = await params;
  return proxy("DELETE", slug);
}
