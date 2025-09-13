-- Seed job categories
INSERT INTO public.job_categories (name, icon, color) VALUES
('Cleaning', '🧹', '#E67E22'),
('Delivery', '🚚', '#3498DB'),
('Handyman', '🔧', '#E74C3C'),
('Gardening', '🌱', '#27AE60'),
('Tutoring', '📚', '#9B59B6'),
('Photography', '📸', '#F39C12'),
('Cooking', '👨‍🍳', '#E67E22'),
('Tech Support', '💻', '#2C3E50'),
('Moving', '📦', '#34495E'),
('Pet Care', '🐕', '#16A085'),
('Beauty', '💄', '#E91E63'),
('Transportation', '🚗', '#3498DB'),
('Others', '📋', '#95A5A6')
ON CONFLICT (name) DO NOTHING;
