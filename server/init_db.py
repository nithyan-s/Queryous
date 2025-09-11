"""
Database initialization and configuration for authentication.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from models import Base
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:///./queryous_auth.db"  # Default to SQLite for development
)

# Create database engine
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL query logging
    pool_pre_ping=True  # Verify connections before use
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Session:
    """
    Dependency function to get database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_database():
    """
    Initialize database tables.
    """
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        
        # Create indexes for performance
        from sqlalchemy import text
        with engine.connect() as conn:
            # Index for user lookups
            try:
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id)"))
                
                # Index for chat sessions
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at)"))
                
                # Index for dashboards
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON dashboards(user_id)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_dashboards_is_public ON dashboards(is_public)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_dashboards_share_token ON dashboards(share_token)"))
                
                # Index for OTP verifications
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_otp_phone_purpose ON otp_verifications(phone_number, purpose)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications(expires_at)"))
                
                # Index for login attempts
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at)"))
                
                conn.commit()
                print("✅ Database indexes created successfully!")
                
            except Exception as e:
                print(f"⚠️  Warning: Could not create some indexes: {e}")
        
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        raise

def reset_database():
    """
    Reset database by dropping and recreating all tables.
    ⚠️ WARNING: This will delete all data!
    """
    try:
        print("⚠️  Resetting database - all data will be lost!")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("✅ Database reset successfully!")
    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        raise

def check_database_connection():
    """
    Check if database connection is working.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connection successful!")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    # Initialize database when run directly
    print("🔧 Initializing Queryous Authentication Database...")
    print(f"📁 Database URL: {DATABASE_URL}")
    
    if check_database_connection():
        init_database()
        print("🎉 Database initialization complete!")
    else:
        print("💥 Database initialization failed!")
