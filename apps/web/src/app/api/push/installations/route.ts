import { PushDeviceRepository } from "@black-swan/db";
import { NextResponse } from "next/server";
import {
  hashInstallationSecret,
  installationSecretMatches,
  parseInstallationCredential,
  parseInstallationUpdate,
} from "@/lib/push-installation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const repository = new PushDeviceRepository();

export async function POST(request: Request) {
  return upsertInstallation(request, false);
}

export async function PATCH(request: Request) {
  return upsertInstallation(request, true);
}

export async function GET(request: Request) {
  const credential = parseInstallationCredential({
    installationId: request.headers.get("x-installation-id"),
    installationSecret: request.headers.get("x-installation-secret"),
  });
  if (!credential) {
    return NextResponse.json({ error: "Invalid installation credential" }, { status: 400 });
  }

  const device = await repository.findByInstallationId(credential.installationId);
  if (!device || !installationSecretMatches(credential.installationSecret, device.installationSecretHash)) {
    return NextResponse.json({ error: "Invalid installation credential" }, { status: 401 });
  }
  return NextResponse.json(toResponse(device), {
    headers: { "cache-control": "no-store" },
  });
}

async function upsertInstallation(request: Request, requireExisting: boolean) {
  const body = await readJson(request);
  const input = parseInstallationUpdate(body);
  if (!input) {
    return NextResponse.json({ error: "Invalid push installation" }, { status: 400 });
  }

  const existing = await repository.findByInstallationId(input.installationId);
  if (requireExisting && !existing) {
    return NextResponse.json({ error: "Installation not found" }, { status: 404 });
  }
  if (
    existing &&
    !installationSecretMatches(input.installationSecret, existing.installationSecretHash)
  ) {
    return NextResponse.json({ error: "Invalid installation credential" }, { status: 401 });
  }
  if (input.expoPushToken) {
    const tokenOwner = await repository.findByExpoPushToken(input.expoPushToken);
    if (tokenOwner && tokenOwner.installationId !== input.installationId) {
      return NextResponse.json({ error: "Expo token already registered" }, { status: 409 });
    }
  }

  const device = await repository.upsertInstallation({
    installationId: input.installationId,
    installationSecretHash:
      existing?.installationSecretHash ?? hashInstallationSecret(input.installationSecret),
    expoPushToken: input.expoPushToken,
    platform: input.platform,
    permissionStatus: input.permissionStatus,
    canAskAgain: input.canAskAgain,
  });
  return NextResponse.json(toResponse(device), { status: existing ? 200 : 201 });
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function toResponse(device: {
  installationId: string;
  userId: string | null;
  enabled: boolean;
  permissionStatus: string;
  canAskAgain: boolean;
  permissionUpdatedAt: Date;
}) {
  return {
    installationId: device.installationId,
    attached: Boolean(device.userId),
    enabled: device.enabled,
    permissionStatus: device.permissionStatus,
    canAskAgain: device.canAskAgain,
    permissionUpdatedAt: device.permissionUpdatedAt.toISOString(),
  };
}
