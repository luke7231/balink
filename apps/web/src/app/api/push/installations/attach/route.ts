import { PushDeviceRepository } from "@black-swan/db";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  installationSecretMatches,
  parseInstallationCredential,
} from "@/lib/push-installation";

export const runtime = "nodejs";

const repository = new PushDeviceRepository();

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const credential = parseInstallationCredential(await readJson(request));
  if (!credential) {
    return NextResponse.json({ error: "Invalid installation credential" }, { status: 400 });
  }
  const device = await repository.findByInstallationId(credential.installationId);
  if (!device || !installationSecretMatches(credential.installationSecret, device.installationSecretHash)) {
    return NextResponse.json({ error: "Invalid installation credential" }, { status: 401 });
  }

  const attached = await repository.attachToUser(credential.installationId, userId);
  return NextResponse.json({
    installationId: attached.installationId,
    attached: true,
  });
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
