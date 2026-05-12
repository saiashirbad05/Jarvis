-- ============================================================
-- SERVICE-ONE — CLOUD SQL SCHEMA
-- Run: psql -h localhost -U postgres -d postgres -f schema.sql
-- ============================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    language_preference VARCHAR(10) DEFAULT 'en',
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quote checks — every analysis run
CREATE TABLE IF NOT EXISTS quote_checks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    city VARCHAR(255) NOT NULL,
    area VARCHAR(255),
    appliance VARCHAR(100) NOT NULL,
    brand VARCHAR(100),
    service_type VARCHAR(100) NOT NULL,
    quoted_price NUMERIC(10,2) NOT NULL,
    fair_range_min NUMERIC(10,2),
    fair_range_max NUMERIC(10,2),
    verdict VARCHAR(20),
    confidence_score NUMERIC(3,2),
    explanation TEXT,
    provider_name VARCHAR(255),
    full_result_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Providers discovered from scraping + Maps
CREATE TABLE IF NOT EXISTS providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    area VARCHAR(255),
    appliance_types TEXT[],
    phone VARCHAR(20),
    address TEXT,
    google_maps_url TEXT,
    website_url TEXT,
    source VARCHAR(50),
    source_url TEXT,
    reliability_score NUMERIC(3,2) DEFAULT 0,
    avg_rating NUMERIC(3,2),
    review_count INTEGER DEFAULT 0,
    avg_price_min NUMERIC(10,2),
    avg_price_max NUMERIC(10,2),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Provider reviews aggregated
CREATE TABLE IF NOT EXISTS provider_reviews_summary (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
    total_reviews INTEGER DEFAULT 0,
    avg_rating NUMERIC(3,2),
    positive_keywords TEXT[],
    negative_keywords TEXT[],
    trust_score NUMERIC(3,2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Community reports from users
CREATE TABLE IF NOT EXISTS community_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    city VARCHAR(255) NOT NULL,
    area VARCHAR(255),
    appliance VARCHAR(100) NOT NULL,
    service_type VARCHAR(100),
    provider_name VARCHAR(255),
    quoted_price NUMERIC(10,2),
    approved_status VARCHAR(20) DEFAULT 'pending',
    proof_image_url TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cached market signals (TTL-based)
CREATE TABLE IF NOT EXISTS cached_market_signals (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(512) UNIQUE NOT NULL,
    city VARCHAR(255) NOT NULL,
    appliance VARCHAR(100) NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    brand VARCHAR(100),
    avg_price NUMERIC(10,2),
    price_range_min NUMERIC(10,2),
    price_range_max NUMERIC(10,2),
    sources_json JSONB,
    provider_suggestions JSONB,
    raw_scraped_data JSONB,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- Search history — full audit trail for dashboard
CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    search_query TEXT NOT NULL,
    appliance_type VARCHAR(100),
    service_type VARCHAR(100),
    city VARCHAR(255),
    quoted_price NUMERIC(10,2),
    verdict VARCHAR(20),
    potential_savings NUMERIC(10,2) DEFAULT 0,
    source_links JSONB DEFAULT '[]'::jsonb,
    full_result_json JSONB,
    is_bookmarked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Custom searches — user-added URLs/queries on dashboard
CREATE TABLE IF NOT EXISTS custom_searches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    search_label VARCHAR(255),
    search_url TEXT NOT NULL,
    search_type VARCHAR(50) DEFAULT 'custom',
    notes TEXT,
    result_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report images
CREATE TABLE IF NOT EXISTS report_images (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES community_reports(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    upload_type VARCHAR(20) DEFAULT 'bill',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin moderation actions
CREATE TABLE IF NOT EXISTS moderation_actions (
    id SERIAL PRIMARY KEY,
    admin_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cache_key ON cached_market_signals(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON cached_market_signals(expires_at);
CREATE INDEX IF NOT EXISTS idx_quote_checks_city ON quote_checks(city);
CREATE INDEX IF NOT EXISTS idx_quote_checks_user ON quote_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_city ON providers(city);
CREATE INDEX IF NOT EXISTS idx_providers_source ON providers(source);
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports(approved_status);

-- Geography / Locality data
CREATE TABLE IF NOT EXISTS geo_locations (
    id SERIAL PRIMARY KEY,
    pincode VARCHAR(10) NOT NULL,
    locality VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_geo_pincode ON geo_locations(pincode);
CREATE INDEX IF NOT EXISTS idx_geo_state_city ON geo_locations(state, city);
CREATE INDEX IF NOT EXISTS idx_geo_city ON geo_locations(city);
