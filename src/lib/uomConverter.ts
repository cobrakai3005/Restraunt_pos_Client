/**
 * Frontend UOM (Unit of Measurement) Conversion Engine & Helpers
 */

export const UOM_FAMILIES = {
  WEIGHT: {
    baseUnit: "KG",
    displayUnits: [
      { value: "KG", label: "Kg (Kilogram)" },
      { value: "GRAM", label: "Gm (Gram)" },
      { value: "MG", label: "Mg (Milligram)" },
    ],
    factors: {
      KG: 1.0,
      KILOGRAM: 1.0,
      GRAM: 0.001,
      GM: 0.001,
      G: 0.001,
      MG: 0.000001,
      MILLIGRAM: 0.000001,
    } as Record<string, number>,
  },
  VOLUME: {
    baseUnit: "LITRE",
    displayUnits: [
      { value: "LITRE", label: "Litre" },
      { value: "ML", label: "Ml (Millilitre)" },
    ],
    factors: {
      LITRE: 1.0,
      LITER: 1.0,
      LTR: 1.0,
      L: 1.0,
      ML: 0.001,
      MILLILITRE: 0.001,
      MILLILITER: 0.001,
    } as Record<string, number>,
  },
  COUNT: {
    baseUnit: "PCS",
    displayUnits: [
      { value: "PCS", label: "Piece (Pcs)" },
      { value: "DOZEN", label: "Dozen (12 pcs)" },
      { value: "PACK", label: "Pack" },
      { value: "BOX", label: "Box" },
    ],
    factors: {
      PCS: 1.0,
      PIECE: 1.0,
      DOZEN: 12.0,
      PACK: 1.0,
      BOX: 1.0,
    } as Record<string, number>,
  },
} as const;

export function normalizeUnit(unit?: string): string {
  if (!unit || typeof unit !== "string") return "";
  return unit.trim().toUpperCase();
}

export function getUnitFamily(unit?: string): "WEIGHT" | "VOLUME" | "COUNT" | "OTHER" {
  const norm = normalizeUnit(unit);
  if (!norm) return "OTHER";

  for (const [familyName, family] of Object.entries(UOM_FAMILIES)) {
    if (norm in family.factors) {
      return familyName as "WEIGHT" | "VOLUME" | "COUNT";
    }
  }
  return "OTHER";
}

export function getCompatibleUnits(unit?: string): Array<{ value: string; label: string }> {
  const norm = normalizeUnit(unit);
  const familyName = getUnitFamily(norm);

  if (familyName !== "OTHER") {
    return [...UOM_FAMILIES[familyName].displayUnits];
  }

  return norm ? [{ value: norm, label: norm }] : [{ value: "PCS", label: "Piece (Pcs)" }];
}

export function convertUOM(quantity: number, fromUnit?: string, toUnit?: string): number {
  const qty = Number(quantity);
  if (isNaN(qty) || qty === 0) return 0;

  const normFrom = normalizeUnit(fromUnit);
  const normTo = normalizeUnit(toUnit);

  if (!normFrom || !normTo || normFrom === normTo) {
    return qty;
  }

  const fromFamily = getUnitFamily(normFrom);
  const toFamily = getUnitFamily(normTo);

  if (fromFamily !== "OTHER" && fromFamily === toFamily) {
    const fromFactor = UOM_FAMILIES[fromFamily].factors[normFrom];
    const toFactor = UOM_FAMILIES[toFamily].factors[normTo];

    if (fromFactor !== undefined && toFactor !== undefined && toFactor > 0) {
      return (qty * fromFactor) / toFactor;
    }
  }

  return qty;
}

export function calculateIngredientCost(
  quantityUsed: number,
  ingredientUnit?: string,
  rawCostPerUnit?: number,
  rawBaseUnit?: string
): number {
  const qty = Number(quantityUsed) || 0;
  const costPerUnit = Number(rawCostPerUnit) || 0;
  if (qty <= 0 || costPerUnit <= 0) return 0;

  const convertedBaseQty = convertUOM(qty, ingredientUnit || rawBaseUnit, rawBaseUnit);
  return convertedBaseQty * costPerUnit;
}
