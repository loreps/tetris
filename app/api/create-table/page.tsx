"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function CreateTablePage() {
  const router = useRouter()

  // Redirect to the database setup page after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/admin/database-setup")
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="container py-12 flex items-center justify-center">
      <Card className="w-full max-w-md border-amber-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-500">
            <AlertTriangle size={20} />
            API Endpoint
          </CardTitle>
          <CardDescription>This is an API endpoint, not a page</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            You are trying to access an API endpoint directly. This endpoint is used to create database tables and
            should be accessed via a POST request.
          </p>
          <p className="text-muted-foreground">Redirecting to the database setup page...</p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => router.push("/admin/database-setup")}
            className="w-full bg-amber-500 hover:bg-amber-600"
          >
            Go to Database Setup
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
