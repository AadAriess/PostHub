import { LogHistory } from "../entity/LogHistory";
import { Tag } from "../entity/Tag";

interface ComparisonResult {
  old: Record<string, any>;
  new: Record<string, any>;
}

// Fungsi UTILITY GLOBAL untuk membandingkan atribut dari dua objek
export function compareEntities(
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
  attributesToCompare: string[],
  relationsToCompare: string[] = [] // Parameter opsional untuk membandingkan relasi (e.g., ['tags'])
): ComparisonResult {
  const oldChanges: Record<string, any> = {};
  const newChanges: Record<string, any> = {};

  // Bandingkan Atribut Utama
  attributesToCompare.forEach((key) => {
    if (oldObj[key] !== newObj[key]) {
      oldChanges[key] = oldObj[key];
      newChanges[key] = newObj[key];
    }
  });

  // Bandingkan Relasi Tags
  if (relationsToCompare.includes("tags")) {
    // Logika ini hanya berjalan jika Tags disertakan dalam relasi untuk dibandingkan
    // Mendapatkan nama tags yang sudah diurutkan dari objek lama dan baru
    const oldTagNames = oldObj.tags
      ? oldObj.tags.map((t: Tag) => t.name).sort()
      : [];
    const newTagNames = newObj.tags
      ? newObj.tags.map((t: Tag) => t.name).sort()
      : [];

    if (JSON.stringify(oldTagNames) !== JSON.stringify(newTagNames)) {
      oldChanges.tags = oldTagNames;
      newChanges.tags = newTagNames;
    }
  }

  return { old: oldChanges, new: newChanges };
}

// Fungsi bantu untuk mencatat Log ke database
export async function createLog(
  entityType: string,
  entityId: number,
  changerId: number,
  changes: ComparisonResult,
  action: "UPDATE" | "DELETE"
): Promise<void> {
  if (Object.keys(changes.new).length === 0 && action === "UPDATE") {
    return;
  }

  const log = LogHistory.create({
    entityType,
    entityId,
    changerId,
    changes: {
      old: changes.old,
      new: changes.new,
      action,
      details:
        action === "UPDATE"
          ? `Updated attributes: ${Object.keys(changes.new).join(", ")}`
          : `${entityType} deleted.`,
    },
  });
  await log.save();
}
