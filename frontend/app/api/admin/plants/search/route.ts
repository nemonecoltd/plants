import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";
const ADMIN_SECRET = process.env.PLANTS_ADMIN_SECRET;

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "관리자 인증 실패" }, { status: 403 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  const res = await fetch(`${BACKEND_URL}/api/admin/plants/search?q=${encodeURIComponent(q)}`, {
    headers: { "x-plants-admin-secret": ADMIN_SECRET ?? "" },
    cache: "no-store",
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
}
