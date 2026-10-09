"use server";

import { PortalName } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { ActionState } from "./actions";
import { requireAdmin, requireCurrentUser } from "./auth";
import { requireModule } from "./modules";
import { portalNames, setPortalListings, syncAllEnabledListings, syncPortalListing, upsertPortalCredential } from "./portals";

export async function updatePortalListingsAction(propertyId: string, formData: FormData) {
  await requireCurrentUser();
  await requireModule("portais");

  const enabled = formData.getAll("portals").map(String).filter((value): value is PortalName => portalNames.includes(value as PortalName));
  await setPortalListings(propertyId, enabled);
  revalidatePath("/admin/portais");
}

export async function syncPortalListingAction(id: string) {
  await requireAdmin("/admin/portais");
  await requireModule("portais");

  await syncPortalListing(id);
  revalidatePath("/admin/portais");
}

export async function syncAllPortalListingsAction() {
  await requireAdmin("/admin/portais");
  await requireModule("portais");

  await syncAllEnabledListings();
  revalidatePath("/admin/portais");
}

export async function updatePortalCredentialAction(portal: PortalName, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin("/admin/portais");
  await requireModule("portais");

  const raw = String(formData.get("config") ?? "{}");
  let parsed: object;
  try {
    parsed = JSON.parse(raw || "{}");
  } catch {
    return { success: false, message: "Configuração inválida: não é um JSON válido." };
  }

  await upsertPortalCredential(portal, parsed);
  revalidatePath("/admin/portais");

  return { success: true, message: "Credenciais salvas." };
}
