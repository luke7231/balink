import { NextResponse } from "next/server";

const DEFAULT_API_URL = "http://localhost:3000/graphql";

export async function POST(request: Request) {
  const endpoint = process.env.API_URL || DEFAULT_API_URL;
  const body = await request.text();

  const upstream = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    cache: "no-store",
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
