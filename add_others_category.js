const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://mcdwkwrsmuxglgtnncym.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZHdrd3JzbXV4Z2xndG5uY3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTQ0MTYsImV4cCI6MjA3MzE3MDQxNn0.uJLhQEE9rR6UIFbwj1HbIglDxhWlc6Amj2dyP8oIdyQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function addOthersCategory() {
  try {
    const { data, error } = await supabase
      .from('job_categories')
      .insert({
        name: 'Others',
        icon: '📋',
        color: '#95A5A6'
      })
      .select()

    if (error) {
      console.error('Error inserting Others category:', error)
    } else {
      console.log('Successfully added Others category:', data)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

addOthersCategory()
