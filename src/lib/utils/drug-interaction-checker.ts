import type { InteractionSeverity } from "@/generated/prisma";

export interface DrugInteractionResult {
  medicineAId: string;
  medicineAName: string;
  medicineBId: string;
  medicineBName: string;
  severity: InteractionSeverity;
  description: string;
}

export interface DrugInteractionCheckResult {
  hasInteractions: boolean;
  hasSevere: boolean;
  interactions: DrugInteractionResult[];
}

/// Cek interaksi antar obat dari daftar medicine IDs.
/// Mencocokkan setiap pasangan obat terhadap database interaksi.
export function checkDrugInteractions(
  medicineIds: string[],
  interactionDatabase: DrugInteractionResult[]
): DrugInteractionCheckResult {
  if (medicineIds.length < 2) {
    return { hasInteractions: false, hasSevere: false, interactions: [] };
  }

  const matchedInteractions: DrugInteractionResult[] = [];

  // Cek setiap pasangan obat yang dipilih
  for (let i = 0; i < medicineIds.length; i++) {
    for (let j = i + 1; j < medicineIds.length; j++) {
      const idA = medicineIds[i];
      const idB = medicineIds[j];

      const found = interactionDatabase.find(
        (interaction) =>
          (interaction.medicineAId === idA && interaction.medicineBId === idB) ||
          (interaction.medicineAId === idB && interaction.medicineBId === idA)
      );

      if (found) {
        matchedInteractions.push(found);
      }
    }
  }

  return {
    hasInteractions: matchedInteractions.length > 0,
    hasSevere: matchedInteractions.some((i) => i.severity === "SEVERE"),
    interactions: matchedInteractions,
  };
}

/// Label Indonesia untuk severity level
export function getSeverityLabel(severity: InteractionSeverity): string {
  const labels: Record<InteractionSeverity, string> = {
    MILD: "Ringan",
    MODERATE: "Sedang",
    SEVERE: "Berat",
  };
  return labels[severity];
}

/// Warna badge untuk severity (Tailwind CSS classes)
export function getSeverityBadgeColor(severity: InteractionSeverity): string {
  const colors: Record<InteractionSeverity, string> = {
    MILD: "bg-blue-100 text-blue-800",
    MODERATE: "bg-yellow-100 text-yellow-800",
    SEVERE: "bg-red-100 text-red-800",
  };
  return colors[severity];
}
