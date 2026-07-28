import { apiDelete, apiGet, apiPost, apiPut } from "./axios";
import { mapCategory, mapCategoryRow, type ApiCategory } from "./mappers";
import type { Category, CategoryRow } from "@/lib/types/asset-management";

const CATEGORY_CODE_PATTERN = /^[A-Z][A-Z0-9]{2,9}$/;

function deriveCategoryCode(categoryName: string): string {
  const alphanumeric = categoryName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const prefix = alphanumeric.slice(0, 4) || "CAT";
  const suffix = Date.now().toString().slice(-6);
  return `${prefix}${suffix}`.slice(0, 10);
}

function toCreateBody(category: Omit<Category, "id">) {
  const categoryCode =
    category.icon && CATEGORY_CODE_PATTERN.test(category.icon)
      ? category.icon
      : deriveCategoryCode(category.category_name);

  return {
    categoryCode,
    name: category.category_name,
    description: category.description ?? null,
  };
}

function toUpdateBody(updates: Partial<Omit<Category, "id">>) {
  const body: { categoryCode?: string; name?: string; description?: string | null } = {};
  if (updates.category_name !== undefined) body.name = updates.category_name;
  if (updates.description !== undefined) body.description = updates.description ?? null;
  if (updates.icon !== undefined && updates.icon && CATEGORY_CODE_PATTERN.test(updates.icon)) {
    body.categoryCode = updates.icon;
  }
  return body;
}

export async function fetchCategories(): Promise<Category[]> {
  const rows = await apiGet<ApiCategory[]>("/categories");
  return rows.map(mapCategory);
}

export async function fetchCategoryRows(): Promise<CategoryRow[]> {
  const rows = await apiGet<ApiCategory[]>("/categories");
  return rows.map(mapCategoryRow);
}

export async function fetchCategoryById(id: string): Promise<Category> {
  const row = await apiGet<ApiCategory>(`/categories/${id}`);
  return mapCategory(row);
}

export async function createCategory(category: Omit<Category, "id">): Promise<Category> {
  const row = await apiPost<ApiCategory>("/categories", toCreateBody(category));
  return mapCategory(row);
}

export async function updateCategory(
  id: string,
  updates: Partial<Omit<Category, "id">>,
): Promise<Category> {
  const row = await apiPut<ApiCategory>(`/categories/${id}`, toUpdateBody(updates));
  return mapCategory(row);
}

export async function deleteCategory(id: string): Promise<void> {
  await apiDelete(`/categories/${id}`);
}
