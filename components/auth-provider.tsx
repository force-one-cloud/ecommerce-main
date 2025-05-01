"use client"

import type React from "react"
import { createContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"

type User = {
  id: string
  email: string
  name: string
  isAdmin?: boolean
}

type AuthContextType = {
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
  isAdmin: boolean
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  loading: true,
  isAdmin: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  // Check if user is logged in on mount and set up auth state listener
  useEffect(() => {
    let mounted = true
    let authListener: { unsubscribe: () => void } | null = null

    const fetchUser = async () => {
      try {
        // Get session
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error fetching session:", error)
          if (mounted) setLoading(false)
          return
        }

        const session = data?.session

        if (session?.user) {
          try {
            // Get user profile from the users table
            const { data: profile, error: profileError } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single()

            if (profileError) {
              console.error("Error fetching user profile:", profileError)
              // Still set basic user info from auth
              if (mounted) {
                setUser({
                  id: session.user.id,
                  email: session.user.email || "",
                  name: session.user.email?.split("@")[0] || "",
                  isAdmin: false,
                })
              }
            } else if (profile && mounted) {
              // Check if user is an admin
              const isUserAdmin = profile.role === "admin"
              setIsAdmin(isUserAdmin)

              setUser({
                id: session.user.id,
                email: session.user.email || "",
                name: profile.name,
                isAdmin: isUserAdmin,
              })
            }
          } catch (err) {
            console.error("Error processing user profile:", err)
            // Fallback to basic user info
            if (mounted) {
              setUser({
                id: session.user.id,
                email: session.user.email || "",
                name: session.user.email?.split("@")[0] || "",
                isAdmin: false,
              })
            }
          }
        }
      } catch (err) {
        console.error("Error in fetchUser:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchUser()

    // Set up auth state change listener with error handling
    try {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth state changed:", event)

        try {
          if (event === "SIGNED_IN" && session) {
            // Get user profile from the users table
            const { data: profile, error: profileError } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single()

            if (profileError) {
              console.error("Error fetching user profile on auth change:", profileError)
              // Still set basic user info from auth
              if (mounted) {
                setUser({
                  id: session.user.id,
                  email: session.user.email || "",
                  name: session.user.email?.split("@")[0] || "",
                  isAdmin: false,
                })
              }
            } else if (mounted) {
              // Check if user is an admin
              const isUserAdmin = profile?.role === "admin"
              setIsAdmin(isUserAdmin)

              setUser({
                id: session.user.id,
                email: session.user.email || "",
                name: profile?.name || session.user.email?.split("@")[0] || "",
                isAdmin: isUserAdmin,
              })
            }

            console.log("User state updated after sign in")
          } else if (event === "SIGNED_OUT" && mounted) {
            setUser(null)
            setIsAdmin(false)
            console.log("User signed out, state cleared")
          }
        } catch (err) {
          console.error("Error in auth state change handler:", err)
        }
      })

      authListener = data.subscription
    } catch (err) {
      console.error("Error setting up auth state change listener:", err)
    }

    return () => {
      mounted = false
      if (authListener) {
        try {
          authListener.unsubscribe()
        } catch (err) {
          console.error("Error unsubscribing from auth state changes:", err)
        }
      }
    }
  }, [supabase])

  // Update the signIn function to be more robust
  const signIn = async (email: string, password: string) => {
    try {
      console.log("AuthProvider: Signing in with email:", email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Supabase auth error:", error)
        throw error
      }

      if (!data.user) {
        throw new Error("No user returned from authentication")
      }

      console.log("Sign in successful, user data:", data.user)

      try {
        // Get user profile from the users table
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .single()

        if (profileError) {
          console.error("Error fetching user profile:", profileError)
          // Create a profile if it doesn't exist
          try {
            const { error: insertError } = await supabase.from("users").insert([
              {
                id: data.user.id,
                email: data.user.email,
                name: data.user.email?.split("@")[0] || "User",
                role: "customer", // Default role
              },
            ])

            if (insertError) {
              console.error("Error creating missing user profile:", insertError)
            }
          } catch (insertErr) {
            console.error("Exception creating user profile:", insertErr)
          }
        }

        // Fetch the profile again or use what we have
        const userName = profile?.name || data.user.email?.split("@")[0] || "User"
        const userRole = profile?.role || "customer"

        // Check if user is an admin
        const isUserAdmin = userRole === "admin"
        setIsAdmin(isUserAdmin)

        setUser({
          id: data.user.id,
          email: data.user.email || "",
          name: userName,
          isAdmin: isUserAdmin,
        })

        toast({
          title: "Signed in successfully",
          description: `Welcome back, ${userName}!`,
        })

        // Dispatch a custom event to trigger cart sync
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("user-signed-in"))
        }
      } catch (profileErr) {
        console.error("Error processing profile after sign in:", profileErr)
        // Set basic user info even if profile processing fails
        setUser({
          id: data.user.id,
          email: data.user.email || "",
          name: data.user.email?.split("@")[0] || "User",
          isAdmin: false,
        })

        toast({
          title: "Signed in with limited profile",
          description: "You're signed in, but we couldn't load your full profile.",
        })
      }

      return data
    } catch (error: any) {
      console.error("Sign in process failed:", error)
      toast({
        title: "Sign in failed",
        description: error.message || "An error occurred during sign in",
        variant: "destructive",
      })
      throw error
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log("AuthProvider: Signing up with email:", email)

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        console.error("Supabase auth signup error:", error)
        throw error
      }

      if (!data.user) {
        throw new Error("No user returned from sign up")
      }

      console.log("Sign up successful, user data:", data.user)

      try {
        // Create user profile in the users table
        const { error: profileError } = await supabase.from("users").insert([
          {
            id: data.user.id,
            email,
            name,
            role: "customer", // Default role
          },
        ])

        if (profileError) {
          console.error("Error creating user profile:", profileError)
          throw profileError
        }

        setUser({
          id: data.user.id,
          email,
          name,
          isAdmin: false,
        })

        toast({
          title: "Account created successfully",
          description: `Welcome, ${name}!`,
        })

        // Dispatch a custom event to trigger cart sync
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("user-signed-in"))
        }
      } catch (profileErr) {
        console.error("Error in profile creation:", profileErr)
        // Still consider signup successful if auth worked but profile creation failed
        setUser({
          id: data.user.id,
          email,
          name,
          isAdmin: false,
        })

        toast({
          title: "Account created with warnings",
          description: "Your account was created but profile setup had issues. Some features may be limited.",
          variant: "destructive",
        })
      }

      return data
    } catch (error: any) {
      console.error("Sign up process failed:", error)
      toast({
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up",
        variant: "destructive",
      })
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }

      setUser(null)
      setIsAdmin(false)

      toast({
        title: "Signed out successfully",
      })

      router.push("/")
    } catch (error: any) {
      console.error("Sign out error:", error)
      toast({
        title: "Sign out failed",
        description: error.message || "An error occurred during sign out",
        variant: "destructive",
      })
    }
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, loading, isAdmin }}>{children}</AuthContext.Provider>
  )
}
