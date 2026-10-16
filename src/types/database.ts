export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      admins: Table<
        { user_id: string; created_at: string },
        { user_id: string; created_at?: string },
        { user_id?: string; created_at?: string }
      >;
      categories: Table<
        {
          id: string;
          slug: string;
          name: string;
          description: string;
          cover_path: string | null;
          sort_order: number;
          is_active: boolean;
        },
        {
          id?: string;
          slug: string;
          name: string;
          description?: string;
          cover_path?: string | null;
          sort_order?: number;
          is_active?: boolean;
        },
        {
          id?: string;
          slug?: string;
          name?: string;
          description?: string;
          cover_path?: string | null;
          sort_order?: number;
          is_active?: boolean;
        }
      >;
      products: Table<
        {
          id: string;
          category_id: string;
          slug: string;
          name: string;
          description: string;
          image_path: string;
          thumb_path: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          category_id: string;
          slug: string;
          name: string;
          description?: string;
          image_path: string;
          thumb_path: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          category_id?: string;
          slug?: string;
          name?: string;
          description?: string;
          image_path?: string;
          thumb_path?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        }
      >;
      orders: Table<
        {
          id: string;
          customer_name: string;
          phone: string;
          summary: string;
          details: string;
          category_id: string | null;
          product_id: string | null;
          status: Database["public"]["Enums"]["order_status"];
          admin_notes: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          customer_name: string;
          phone: string;
          summary: string;
          details?: string;
          category_id?: string | null;
          product_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          admin_notes?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          customer_name?: string;
          phone?: string;
          summary?: string;
          details?: string;
          category_id?: string | null;
          product_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          admin_notes?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      order_attachments: Table<
        {
          id: string;
          order_id: string;
          storage_path: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          uploaded: boolean;
          created_at: string;
        },
        {
          id?: string;
          order_id: string;
          storage_path: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          uploaded?: boolean;
          created_at?: string;
        },
        {
          id?: string;
          order_id?: string;
          storage_path?: string;
          file_name?: string;
          mime_type?: string;
          size_bytes?: number;
          uploaded?: boolean;
          created_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      order_status: "nuevo" | "en_proceso" | "listo" | "entregado" | "cancelado";
    };
    CompositeTypes: Record<string, never>;
  };
};
