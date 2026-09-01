export type CategoryNode = {
  id: string;
  name: string;
  parent_id?: string | null;
};

export type CategoryOption = { id: string; label: string };

/**
 * Flattens categories into pickable options, labelling each subcategory with
 * its full path ("Electronics › Mobile Phones").
 *
 * A bare subcategory name is ambiguous -- "Accessories" could sit under
 * several parents -- so the path is what makes an option identifiable in a
 * flat list like a <select>.
 *
 * Sorting on the finished label groups each parent with its own children,
 * because a child's label starts with its parent's name.
 */
export function toCategoryOptions(categories: CategoryNode[]): CategoryOption[] {
  const nameById = new Map(categories.map((c) => [c.id, c.name]));

  return categories
    .map((c) => ({
      id: c.id,
      label: c.parent_id
        ? `${nameById.get(c.parent_id) ?? "?"} › ${c.name}`
        : c.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
