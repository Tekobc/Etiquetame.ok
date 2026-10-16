import type { Metadata } from "next";
import { ProductManager } from "./product-manager";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-access";

export const metadata: Metadata = {
  title: "Productos | Panel de administración",
};

export default async function AdminProductsPage() {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const [categoriesResult, productsResult] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("products").select("*").order("created_at", { ascending: false }),
  ]);

  if (categoriesResult.error || productsResult.error) {
    throw new Error("No se pudieron cargar los productos y categorías.", {
      cause: categoriesResult.error ?? productsResult.error,
    });
  }

  const categories = categoriesResult.data;
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const products = productsResult.data.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    categoryId: product.category_id,
    categoryName: categoryNames.get(product.category_id) ?? "Sin categoría",
    imageUrl: supabase.storage.from("products").getPublicUrl(product.image_path).data.publicUrl,
    thumbUrl: supabase.storage.from("products").getPublicUrl(product.thumb_path).data.publicUrl,
    isActive: product.is_active,
  }));

  return (
    <main className="admin-dashboard admin-products-page">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">La vidriera de Etiquétame</p>
          <h1>Productos</h1>
        </div>
      </div>
      <ProductManager categories={categories} products={products} />
    </main>
  );
}
