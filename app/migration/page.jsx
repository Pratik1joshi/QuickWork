"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function DatabaseMigration() {
  const [status, setStatus] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const runMigration = async () => {
    setIsLoading(true)
    setStatus("Running migration...")

    try {
      const supabase = createClient()

      // Add workers_needed column
      const { error } = await supabase.rpc("exec_sql", {
        sql: `
          ALTER TABLE public.jobs 
          ADD COLUMN IF NOT EXISTS workers_needed INTEGER DEFAULT 1 NOT NULL;
          
          UPDATE public.jobs 
          SET workers_needed = 1 
          WHERE workers_needed IS NULL;
        `
      })

      if (error) {
        setStatus(`Error: ${error.message}`)
      } else {
        setStatus("Migration completed successfully!")
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Migration</h1>
      <Button onClick={runMigration} disabled={isLoading}>
        {isLoading ? "Running..." : "Add workers_needed column"}
      </Button>
      {status && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          {status}
        </div>
      )}
    </div>
  )
}
