const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://mcdwkwrsmuxglgtnncym.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZHdrd3JzbXV4Z2xndG5uY3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTQ0MTYsImV4cCI6MjA3MzE3MDQxNn0.uJLhQEE9rR6UIFbwj1HbIglDxhWlc6Amj2dyP8oIdyQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedDemoJobs() {
  try {
    console.log('Starting to seed demo jobs...')

    // First, let's try to get an existing user or create one
    // For now, let's assume there's at least one user and get their ID
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (profileError || !profiles || profiles.length === 0) {
      console.error('No profiles found. Please create a user first.')
      return
    }

    const employerId = profiles[0].id
    console.log('Using employer ID:', employerId)

    // Get category IDs
    const { data: categories, error: catError } = await supabase
      .from('job_categories')
      .select('id, name')

    if (catError) {
      console.error('Error fetching categories:', catError)
      return
    }

    const categoryMap = {}
    categories?.forEach(cat => {
      categoryMap[cat.name.toLowerCase()] = cat.id
    })

    console.log('Category map:', categoryMap)

    // Demo jobs data
    const demoJobs = [
      {
        title: 'House Cleaning Needed',
        description: 'Need someone to clean a 3-bedroom apartment. Includes kitchen, bathrooms, and living areas. All cleaning supplies provided.',
        category_id: categoryMap['cleaning'],
        employer_id: employerId,
        budget_min: 1500,
        budget_max: 2500,
        location: 'Thamel, Kathmandu',
        urgency: 'normal',
        estimated_duration: '3-4 hours',
        requirements: 'Experience with cleaning preferred. Must bring own transportation.',
        contact_preference: 'app',
        status: 'open'
      },
      {
        title: 'Document Delivery Service',
        description: 'Need someone to deliver important documents across Kathmandu valley. Multiple deliveries throughout the day.',
        category_id: categoryMap['delivery'],
        employer_id: employerId,
        budget_min: 1000,
        budget_max: 2000,
        location: 'Kathmandu Valley',
        urgency: 'high',
        estimated_duration: 'Full day',
        requirements: 'Must have motorcycle/scooter. Valid license required.',
        contact_preference: 'phone',
        status: 'open'
      },
      {
        title: 'Furniture Assembly',
        description: 'Need help assembling IKEA furniture for a new apartment. About 6-7 pieces total.',
        category_id: categoryMap['handyman'],
        employer_id: employerId,
        budget_min: 2000,
        budget_max: 3500,
        location: 'Lazimpat, Kathmandu',
        urgency: 'normal',
        estimated_duration: '4-5 hours',
        requirements: 'Basic tools knowledge required. Experience with furniture assembly preferred.',
        contact_preference: 'app',
        status: 'open'
      },
      {
        title: 'Garden Maintenance',
        description: 'Weekly garden maintenance including mowing, trimming, and weeding.',
        category_id: categoryMap['gardening'],
        employer_id: employerId,
        budget_min: 1800,
        budget_max: 2500,
        location: 'Budhanilkantha, Kathmandu',
        urgency: 'normal',
        estimated_duration: '3 hours per week',
        requirements: 'Gardening tools and experience preferred.',
        contact_preference: 'app',
        status: 'open'
      },
      {
        title: 'Math Tutoring',
        description: 'Need math tutor for grade 10 student. Focus on algebra and geometry.',
        category_id: categoryMap['tutoring'],
        employer_id: employerId,
        budget_min: 1500,
        budget_max: 2000,
        location: 'Patan',
        urgency: 'normal',
        estimated_duration: '2 hours per session',
        requirements: 'Teaching experience and math background required.',
        contact_preference: 'app',
        status: 'open'
      },
      {
        title: 'General House Help',
        description: 'Need general help around the house including cleaning, organizing, and minor repairs.',
        category_id: null, // Others category
        employer_id: employerId,
        budget_min: 1800,
        budget_max: 2800,
        location: 'Swayambhu, Kathmandu',
        urgency: 'normal',
        estimated_duration: '4 hours',
        requirements: 'Reliable and hardworking individual needed.',
        contact_preference: 'app',
        status: 'open'
      }
    ]

    // Insert demo jobs
    for (const job of demoJobs) {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .insert(job)
          .select()

        if (error) {
          console.error('Error inserting job:', job.title, error)
        } else {
          console.log('Successfully inserted job:', job.title)
        }
      } catch (error) {
        console.error('Error inserting job:', job.title, error)
      }
    }

    console.log('Demo jobs seeding completed!')

  } catch (error) {
    console.error('Error seeding demo jobs:', error)
  }
}

seedDemoJobs()
