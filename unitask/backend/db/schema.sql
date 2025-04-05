-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  display_name VARCHAR(100) NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('freelancer', 'business', 'admin')),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- User Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  avatar_url VARCHAR(255),
  title VARCHAR(100),
  description TEXT,
  location VARCHAR(100),
  website VARCHAR(255),
  skills VARCHAR(50)[],
  rating NUMERIC(3,2),
  reviews INTEGER DEFAULT 0
);

-- Business Profiles Table
CREATE TABLE IF NOT EXISTS business_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(100),
  industry VARCHAR(100),
  company_size VARCHAR(20),
  company_description TEXT,
  logo_url VARCHAR(255),
  website_url VARCHAR(255),
  verified BOOLEAN DEFAULT FALSE,
  location VARCHAR(100),
  phone_number VARCHAR(20)
);

-- Languages Table (for user profiles)
CREATE TABLE IF NOT EXISTS user_languages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL,
  UNIQUE(user_id, name)
);

-- Education Table (for user profiles)
CREATE TABLE IF NOT EXISTS user_education (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  institution VARCHAR(100) NOT NULL,
  degree VARCHAR(100) NOT NULL,
  start_year INTEGER NOT NULL,
  end_year INTEGER
);

-- Experience Table (for user profiles)
CREATE TABLE IF NOT EXISTS user_experience (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  position VARCHAR(100) NOT NULL,
  company VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT
);

-- Gigs Table
CREATE TABLE IF NOT EXISTS gigs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  tags VARCHAR(30)[],
  base_price NUMERIC(10,2) NOT NULL,
  delivery_time INTEGER NOT NULL,
  revision_count INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'inactive'))
);

-- Gig Images Table
CREATE TABLE IF NOT EXISTS gig_images (
  id SERIAL PRIMARY KEY,
  gig_id INTEGER REFERENCES gigs(id) ON DELETE CASCADE,
  url VARCHAR(255) NOT NULL,
  is_main BOOLEAN DEFAULT FALSE,
  display_order INTEGER NOT NULL
);

-- Gig Packages Table
CREATE TABLE IF NOT EXISTS gig_packages (
  id SERIAL PRIMARY KEY,
  gig_id INTEGER REFERENCES gigs(id) ON DELETE CASCADE,
  package_type VARCHAR(20) NOT NULL CHECK (package_type IN ('basic', 'standard', 'premium')),
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  delivery_time INTEGER NOT NULL,
  revision_count INTEGER NOT NULL,
  features TEXT[]
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  gig_id INTEGER REFERENCES gigs(id),
  buyer_id INTEGER REFERENCES users(id),
  seller_id INTEGER REFERENCES users(id),
  package_id INTEGER REFERENCES gig_packages(id),
  requirements TEXT,
  price NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'disputed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completion_date TIMESTAMP
);

-- Order Milestones
CREATE TABLE IF NOT EXISTS order_milestones (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  due_date TIMESTAMP,
  amount NUMERIC(10,2),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Order Deliveries
CREATE TABLE IF NOT EXISTS order_deliveries (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  message TEXT,
  attachment_url VARCHAR(255)[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  order_id INTEGER UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  reviewer_id INTEGER REFERENCES users(id),
  reviewee_id INTEGER REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  project_id INTEGER,
  order_id INTEGER REFERENCES orders(id)
);

-- Conversation Participants Table
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (conversation_id, user_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id),
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

-- Message Attachments Table
CREATE TABLE IF NOT EXISTS message_attachments (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  url VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  size INTEGER -- in bytes
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  link VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

-- Push Subscriptions Table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table (for project bidding system)
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50),
  skills VARCHAR(50)[],
  budget_min NUMERIC(10,2),
  budget_max NUMERIC(10,2),
  deadline TIMESTAMP,
  attachment_url VARCHAR(255),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'awarded', 'completed', 'cancelled', 'closed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  bid_count INTEGER DEFAULT 0
);

-- Bids Table
CREATE TABLE IF NOT EXISTS bids (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  freelancer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  delivery_time INTEGER NOT NULL, -- in days
  proposal TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Awards Table
CREATE TABLE IF NOT EXISTS project_awards (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  freelancer_id INTEGER REFERENCES users(id),
  bid_id INTEGER REFERENCES bids(id),
  amount NUMERIC(10,2) NOT NULL,
  deadline TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled'))
);

-- CREATE INDEXES for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_gigs_user_id ON gigs(user_id);
CREATE INDEX idx_gigs_category ON gigs(category);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_projects_business_id ON projects(business_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_bids_project_id ON bids(project_id);
CREATE INDEX idx_bids_freelancer_id ON bids(freelancer_id);

-- TRIGGER to update user profile ratings when a review is added
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the reviewee's profile with new average rating and review count
  UPDATE profiles
  SET 
    rating = (
      SELECT AVG(rating) 
      FROM reviews 
      WHERE reviewee_id = NEW.reviewee_id
    ),
    reviews = (
      SELECT COUNT(*) 
      FROM reviews 
      WHERE reviewee_id = NEW.reviewee_id
    )
  WHERE user_id = NEW.reviewee_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_after_review
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_user_rating();

-- TRIGGER to update conversation updated_at when a new message is added
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_after_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- TRIGGER to update project bid_count when a bid is added or withdrawn
CREATE OR REPLACE FUNCTION update_project_bid_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment bid count
    UPDATE projects
    SET bid_count = bid_count + 1
    WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement bid count
    UPDATE projects
    SET bid_count = GREATEST(0, bid_count - 1)
    WHERE id = OLD.project_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bid_count_after_bid_change
AFTER INSERT OR DELETE ON bids
FOR EACH ROW
EXECUTE FUNCTION update_project_bid_count();
