"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-access";
import { slugifyProductName } from "@/lib/products/slug";
import { slugifyCategoryName } from "@/lib/categories/slug";
import {
  categoryInputSchema,
  updateCategoryInputSchema,
} from "@/lib/validation/category";
import {
  productInputSchema,
  updateProductInputSchema,
} from "@/lib/validation/product";

async function getUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  name: string,
  ignoredProductId?: string,
) {
  const base = slugifyProductName(name);
  for (let suffix = 1; suffix <= 100; suffix += 1) {
    const slug = suffix === 1 ? base : `${base}-${suffix}`;
    let query = supabase.from("products").select("id").eq("slug", slug);
    if (ignoredProductId) query = query.neq("id", ignoredProductId);
    const { data, error } = await query.maybeSingle();
    if (error) {
      throw new Error("No se pudo comprobar si el nombre del producto está disponible.", {
        cause: error,
      });
    }

    if (!data) return slug;
  }
  throw new Error("No se pudo generar un enlace único para este producto.");
}

async function getUniqueCategorySlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  name: string,
  ignoredCategoryId?: string,
) {
  const base = slugifyCategoryName(name);
  for (let suffix = 1; suffix <= 100; suffix += 1) {
    const slug = suffix === 1 ? base : `${base}-${suffix}`;
    let query = supabase.from("categories").select("id").eq("slug", slug);
    if (ignoredCategoryId) query = query.neq("id", ignoredCategoryId);
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error("No se pudo comprobar el nombre de la categoría.", { cause: error });
    if (!data) return slug;
  }
  throw new Error("No se pudo generar un enlace único para esta categoría.");
}

function assertUuid(value: string) {
  if (!/^[0-9a-f-]{36}$/i.test(value)) throw new Error("La categoría no es válida.");
}

export async function createCategoryAction(
  categoryId: string,
  input: { name: string; description: string; hasCover: boolean },
) {
  const parsed = categoryInputSchema.safeParse({ ...input, id: categoryId });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Revisá los datos de la categoría.");
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { data: existing, error: existingError } = await supabase
    .from("categories").select("id").eq("id", parsed.data.id).maybeSingle();
  if (existingError) throw new Error("No se pudo comprobar la categoría.", { cause: existingError });
  if (existing) return { id: existing.id };
  const { error } = await supabase.from("categories").insert({
    id: parsed.data.id,
    slug: await getUniqueCategorySlug(supabase, parsed.data.name),
    name: parsed.data.name,
    description: parsed.data.description,
    cover_path: input.hasCover ? `categories/${parsed.data.id}/cover.webp` : null,
    is_active: true,
  });
  if (error) {
    if (input.hasCover) await supabase.storage.from("products").remove([`categories/${parsed.data.id}/cover.webp`]);
    throw new Error("No se pudo crear la categoría.", { cause: error });
  }
  revalidatePath("/");
  revalidatePath("/admin/productos");
  return { id: parsed.data.id };
}

export async function updateCategoryAction(
  categoryId: string,
  input: { name: string; description: string; hasCover: boolean },
) {
  assertUuid(categoryId);
  const parsed = updateCategoryInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Revisá los datos de la categoría.");
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { data: category, error: queryError } = await supabase
    .from("categories").select("cover_path").eq("id", categoryId).maybeSingle();
  if (queryError) throw new Error("No se pudo encontrar la categoría.", { cause: queryError });
  if (!category) throw new Error("La categoría ya no existe.");
  const { error } = await supabase.from("categories").update({
    slug: await getUniqueCategorySlug(supabase, parsed.data.name, categoryId),
    name: parsed.data.name,
    description: parsed.data.description,
    cover_path: input.hasCover ? `categories/${categoryId}/cover.webp` : category.cover_path,
  }).eq("id", categoryId);
  if (error) throw new Error("No se pudieron guardar los cambios de la categoría.", { cause: error });
  revalidatePath("/");
  revalidatePath("/admin/productos");
}

export async function setCategoryActiveAction(categoryId: string, isActive: boolean) {
  assertUuid(categoryId);
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { error } = await supabase.from("categories").update({ is_active: isActive }).eq("id", categoryId);
  if (error) throw new Error("No se pudo cambiar la visibilidad de la categoría.", { cause: error });
  revalidatePath("/");
  revalidatePath("/admin/productos");
}

export async function createProductAction(
  productId: string,
  input: { name: string; description: string; categoryId: string },
) {
  const parsed = productInputSchema.safeParse({ ...input, id: productId });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Revisá los datos del producto.");
  }

  const supabase = await createClient();
  await requireAdmin(supabase);
  const { data: existing, error: existingError } = await supabase
    .from("products")
    .select("id")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (existingError) {
    throw new Error("No se pudo comprobar el estado de la publicación.", {
      cause: existingError,
    });
  }
  if (existing) return { id: existing.id };

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", parsed.data.categoryId)
    .maybeSingle();
  if (categoryError || !category) {
    throw new Error("Elegí una categoría válida.", { cause: categoryError });
  }

  const { error } = await supabase.from("products").insert({
    id: parsed.data.id,
    slug: await getUniqueSlug(supabase, parsed.data.name),
    name: parsed.data.name,
    description: parsed.data.description,
    category_id: parsed.data.categoryId,
    image_path: `${parsed.data.id}/main.webp`,
    thumb_path: `${parsed.data.id}/thumb.webp`,
    is_active: true,
  });

  if (error) {
    const { error: cleanupError } = await supabase.storage
      .from("products")
      .remove([`${parsed.data.id}/main.webp`, `${parsed.data.id}/thumb.webp`]);
    if (cleanupError) {
      console.error("[admin-products] No se pudieron limpiar las imágenes huérfanas:", cleanupError);
    }
    throw new Error("No se pudo publicar el producto.", { cause: error });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/productos");
  return { id: parsed.data.id };
}

export async function updateProductAction(
  productId: string,
  input: { name: string; description: string; categoryId: string },
) {
  const parsed = updateProductInputSchema.safeParse(input);
  if (!/^[0-9a-f-]{36}$/i.test(productId) || !parsed.success) {
    throw new Error(parsed.success ? "El producto no es válido." : parsed.error.issues[0]?.message);
  }

  const supabase = await createClient();
  await requireAdmin(supabase);
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", parsed.data.categoryId)
    .maybeSingle();
  if (categoryError || !category) {
    throw new Error("Elegí una categoría válida.", { cause: categoryError });
  }

  const { error } = await supabase
    .from("products")
    .update({
      slug: await getUniqueSlug(supabase, parsed.data.name, productId),
      name: parsed.data.name,
      description: parsed.data.description,
      category_id: parsed.data.categoryId,
    })
    .eq("id", productId);

  if (error) {
    throw new Error("No se pudieron guardar los cambios del producto.", {
      cause: error,
    });
  }
  revalidatePath("/");
  revalidatePath("/admin/productos");
}

export async function setProductActiveAction(
  productId: string,
  isActive: boolean,
) {
  if (!/^[0-9a-f-]{36}$/i.test(productId)) {
    throw new Error("El producto no es válido.");
  }
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", productId);
  if (error) {
    throw new Error("No se pudo cambiar la visibilidad del producto.", {
      cause: error,
    });
  }
  revalidatePath("/");
  revalidatePath("/admin/productos");
}

export async function deleteProductAction(productId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(productId)) {
    throw new Error("El producto no es válido.");
  }

  const supabase = await createClient();
  await requireAdmin(supabase);
  const { data: product, error: queryError } = await supabase
    .from("products")
    .select("image_path, thumb_path")
    .eq("id", productId)
    .maybeSingle();
  if (queryError) {
    throw new Error("No se pudo encontrar el producto.", { cause: queryError });
  }
  if (!product) {
    throw new Error("El producto ya no existe.");
  }

  const { error: storageError } = await supabase.storage
    .from("products")
    .remove([product.image_path, product.thumb_path]);
  if (storageError) {
    throw new Error("No se pudieron borrar las imágenes del producto.", {
      cause: storageError,
    });
  }

  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) {
    throw new Error("No se pudo borrar el producto.", { cause: error });
  }
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/productos");
}
