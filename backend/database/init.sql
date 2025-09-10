-- Initial database setup for treasure hunt app
-- This script will run when the PostgreSQL container starts

-- Enable UUID extension (useful for future QR code generation)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance (TypeORM will create the tables)
-- These will be created after TypeORM sync/migrations run