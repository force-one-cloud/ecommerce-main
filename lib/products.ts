import { getSupabaseServerClient } from "./supabase"

export type Product = {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  stock: number
}

export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = getSupabaseServerClient()

    const { data, error } = await supabase.from("products").select("*").order("name")

    if (error) {
      console.error("Error fetching products:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Exception fetching products:", error)
    return []
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const supabase = getSupabaseServerClient()

    const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

    if (error) {
      console.error(`Error fetching product with id ${id}:`, error)
      return null
    }

    return data
  } catch (error) {
    console.error(`Exception fetching product with id ${id}:`, error)
    return null
  }
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  try {
    const supabase = getSupabaseServerClient()

    const { data, error } = await supabase.from("products").select("*").eq("category", category).order("name")

    if (error) {
      console.error(`Error fetching products in category ${category}:`, error)
      return []
    }

    return data || []
  } catch (error) {
    console.error(`Exception fetching products in category ${category}:`, error)
    return []
  }
}

export async function getFeaturedProducts(limit = 3): Promise<Product[]> {
  try {
    const supabase = getSupabaseServerClient()

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching featured products:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Exception fetching featured products:", error)
    return []
  }
}
