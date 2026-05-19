export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          name_en: string | null
          name_nl: string | null
          name_pt: string | null
          parent_id: string | null
          slug: string
          type: Database["public"]["Enums"]["category_type_enum"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          name_en?: string | null
          name_nl?: string | null
          name_pt?: string | null
          parent_id?: string | null
          slug: string
          type: Database["public"]["Enums"]["category_type_enum"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string | null
          name_nl?: string | null
          name_pt?: string | null
          parent_id?: string | null
          slug?: string
          type?: Database["public"]["Enums"]["category_type_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_closure: {
        Row: {
          ancestor_id: string
          depth: number
          descendant_id: string
        }
        Insert: {
          ancestor_id: string
          depth: number
          descendant_id: string
        }
        Update: {
          ancestor_id?: string
          depth?: number
          descendant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_closure_ancestor_id_fkey"
            columns: ["ancestor_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_closure_descendant_id_fkey"
            columns: ["descendant_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          id: string
          location_id: string
          low_stock_threshold: number
          qty_available: number
          qty_incoming: number
          qty_reserved: number
          reorder_point: number
          updated_at: string
          variant_id: string
        }
        Insert: {
          id?: string
          location_id: string
          low_stock_threshold?: number
          qty_available?: number
          qty_incoming?: number
          qty_reserved?: number
          reorder_point?: number
          updated_at?: string
          variant_id: string
        }
        Update: {
          id?: string
          location_id?: string
          low_stock_threshold?: number
          qty_available?: number
          qty_incoming?: number
          qty_reserved?: number
          reorder_point?: number
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["variant_id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          location_id: string
          movement_type: Database["public"]["Enums"]["movement_type_enum"]
          notes: string | null
          qty_delta: number
          reference_id: string | null
          reference_type: string | null
          variant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          location_id: string
          movement_type: Database["public"]["Enums"]["movement_type_enum"]
          notes?: string | null
          qty_delta: number
          reference_id?: string | null
          reference_type?: string | null
          variant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string
          movement_type?: Database["public"]["Enums"]["movement_type_enum"]
          notes?: string | null
          qty_delta?: number
          reference_id?: string | null
          reference_type?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["variant_id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          location_type: Database["public"]["Enums"]["location_type_enum"]
          name: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          location_type: Database["public"]["Enums"]["location_type_enum"]
          name: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          location_type?: Database["public"]["Enums"]["location_type_enum"]
          name?: string
        }
        Relationships: []
      }
      member_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      phone_otps: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          phone: string
          user_id: string | null
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          user_id?: string | null
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          display_order: number
          id: string
          is_primary: boolean
          product_id: string
          url: string
          variant_id: string | null
        }
        Insert: {
          alt?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_primary?: boolean
          product_id: string
          url: string
          variant_id?: string | null
        }
        Update: {
          alt?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_primary?: boolean
          product_id?: string
          url?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["variant_id"]
          },
        ]
      }
      product_specifications: {
        Row: {
          display_order: number
          id: string
          product_id: string
          spec_group: string
          spec_key: string
          spec_value: string
        }
        Insert: {
          display_order?: number
          id?: string
          product_id: string
          spec_group: string
          spec_key: string
          spec_value: string
        }
        Update: {
          display_order?: number
          id?: string
          product_id?: string
          spec_group?: string
          spec_key?: string
          spec_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_specifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_specifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["product_id"]
          },
        ]
      }
      product_tag_map: {
        Row: {
          product_id: string
          tag_id: string
        }
        Insert: {
          product_id: string
          tag_id: string
        }
        Update: {
          product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tag_map_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tag_map_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_tag_map_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          price_override: number | null
          product_id: string
          sku: string
          weight_grams: number | null
        }
        Insert: {
          attributes?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          price_override?: number | null
          product_id: string
          sku: string
          weight_grams?: number | null
        }
        Update: {
          attributes?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          price_override?: number | null
          product_id?: string
          sku?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_stock"
            referencedColumns: ["product_id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          category_id: string
          color_hex: string | null
          created_at: string
          currency: string
          description: string | null
          description_en: string | null
          description_nl: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          is_subscription_exclusive: boolean
          meta_description: string | null
          meta_title: string | null
          name: string
          name_en: string | null
          name_nl: string | null
          name_pt: string | null
          product_type: Database["public"]["Enums"]["product_type_enum"]
          sale_price: number | null
          short_description: string | null
          sku_prefix: string | null
          slug: string
          updated_at: string
          weight_grams: number | null
        }
        Insert: {
          base_price: number
          category_id: string
          color_hex?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          description_en?: string | null
          description_nl?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_subscription_exclusive?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name: string
          name_en?: string | null
          name_nl?: string | null
          name_pt?: string | null
          product_type: Database["public"]["Enums"]["product_type_enum"]
          sale_price?: number | null
          short_description?: string | null
          sku_prefix?: string | null
          slug: string
          updated_at?: string
          weight_grams?: number | null
        }
        Update: {
          base_price?: number
          category_id?: string
          color_hex?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          description_en?: string | null
          description_nl?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_subscription_exclusive?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          name_en?: string | null
          name_nl?: string | null
          name_pt?: string | null
          product_type?: Database["public"]["Enums"]["product_type_enum"]
          sale_price?: number | null
          short_description?: string | null
          sku_prefix?: string | null
          slug?: string
          updated_at?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          must_complete_profile: boolean
          phone: string | null
          phone_verified: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          must_complete_profile?: boolean
          phone?: string | null
          phone_verified?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          must_complete_profile?: boolean
          phone?: string | null
          phone_verified?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          name: string
          tag_type: Database["public"]["Enums"]["tag_type_enum"]
        }
        Insert: {
          id?: string
          name: string
          tag_type: Database["public"]["Enums"]["tag_type_enum"]
        }
        Update: {
          id?: string
          name?: string
          tag_type?: Database["public"]["Enums"]["tag_type_enum"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_product_stock: {
        Row: {
          attributes: Json | null
          category_id: string | null
          is_low_stock: boolean | null
          product_id: string | null
          product_name: string | null
          product_type: Database["public"]["Enums"]["product_type_enum"] | null
          sku: string | null
          slug: string | null
          total_available: number | null
          total_incoming: number | null
          total_reserved: number | null
          variant_id: string | null
          variant_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      fn_adjust_stock: {
        Args: {
          p_delta: number
          p_location_id: string
          p_movement_type: Database["public"]["Enums"]["movement_type_enum"]
          p_notes?: string
          p_reference_id?: string
          p_reference_type?: string
          p_variant_id: string
        }
        Returns: {
          id: string
          location_id: string
          low_stock_threshold: number
          qty_available: number
          qty_incoming: number
          qty_reserved: number
          reorder_point: number
          updated_at: string
          variant_id: string
        }
        SetofOptions: {
          from: "*"
          to: "inventory"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "member" | "guest"
      category_type_enum:
        | "bike"
        | "accessory"
        | "service"
        | "insurance"
        | "part"
      location_type_enum: "warehouse" | "store_floor" | "virtual"
      movement_type_enum:
        | "sale"
        | "return"
        | "adjustment"
        | "transfer"
        | "incoming"
        | "reservation"
        | "reservation_release"
      product_type_enum:
        | "bike"
        | "accessory"
        | "service"
        | "bundle"
        | "subscription_addon"
        | "insurance"
      tag_type_enum:
        | "use_case"
        | "terrain"
        | "rider_level"
        | "feature"
        | "style"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "member", "guest"],
      category_type_enum: ["bike", "accessory", "service", "insurance", "part"],
      location_type_enum: ["warehouse", "store_floor", "virtual"],
      movement_type_enum: [
        "sale",
        "return",
        "adjustment",
        "transfer",
        "incoming",
        "reservation",
        "reservation_release",
      ],
      product_type_enum: [
        "bike",
        "accessory",
        "service",
        "bundle",
        "subscription_addon",
        "insurance",
      ],
      tag_type_enum: ["use_case", "terrain", "rider_level", "feature", "style"],
    },
  },
} as const
