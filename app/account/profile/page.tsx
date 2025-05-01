"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/ui/use-toast"

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  })

  useEffect(() => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to sign in to view your profile.",
        variant: "destructive",
      })
      router.push("/signin")
      return
    }

    setFormData({
      name: user.name,
      email: user.email,
    })
  }, [user, router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // In a real app, this would update the user profile in the database
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    })
  }

  if (!user) {
    return null
  }

  return (
    <div className="container py-8">
      <h1 className="mb-8 text-3xl font-bold">My Profile</h1>

      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your account information.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} disabled />
                <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full">
                Save Changes
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={signOut}>
                Sign Out
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
