from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=True)
    full_name = Column(String(255), nullable=True)
    phone_number = Column(String(20), nullable=True)
    
    # Password authentication
    hashed_password = Column(String(255), nullable=True)
    is_email_verified = Column(Boolean, default=False)
    is_phone_verified = Column(Boolean, default=False)
    
    # OAuth providers
    google_id = Column(String(255), nullable=True, unique=True)
    github_id = Column(String(255), nullable=True, unique=True)
    avatar_url = Column(String(500), nullable=True)
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Personalization
    preferences = Column(JSON, default=dict)  # Theme, layout preferences, etc.
    
    # Relationships
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    dashboards = relationship("Dashboard", back_populates="user", cascade="all, delete-orphan")
    user_preferences = relationship("UserPreference", back_populates="user", cascade="all, delete-orphan")

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False, default="New Chat")
    
    # Session data
    messages = Column(JSON, default=list)  # Store chat messages
    database_connection = Column(JSON, nullable=True)  # Store DB connection details
    
    # Metadata
    is_favorite = Column(Boolean, default=False)
    tags = Column(JSON, default=list)  # User-defined tags
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="chat_sessions")

class Dashboard(Base):
    __tablename__ = "dashboards"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Dashboard data
    data = Column(JSON, nullable=False)  # Raw table data
    config = Column(JSON, default=dict)  # Dashboard configuration
    
    # Sharing and access
    is_public = Column(Boolean, default=False)
    share_token = Column(String(255), nullable=True, unique=True)
    
    # Metadata
    is_favorite = Column(Boolean, default=False)
    tags = Column(JSON, default=list)
    view_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="dashboards")

class UserPreference(Base):
    __tablename__ = "user_preferences"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # UI Preferences
    theme = Column(String(20), default="dark")  # dark, light
    sidebar_collapsed = Column(Boolean, default=False)
    dashboard_layout = Column(String(20), default="grid")  # grid, list
    charts_per_row = Column(Integer, default=2)
    
    # Chat Preferences
    auto_save_chats = Column(Boolean, default=True)
    chat_suggestions = Column(Boolean, default=True)
    voice_input_enabled = Column(Boolean, default=True)
    
    # Data Preferences
    default_chart_type = Column(String(20), default="auto")
    max_rows_display = Column(Integer, default=100)
    export_format = Column(String(10), default="csv")
    
    # Notification Preferences
    email_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="user_preferences")

class OTPVerification(Base):
    __tablename__ = "otp_verifications"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    phone_number = Column(String(20), nullable=False)
    otp_code = Column(String(6), nullable=False)
    purpose = Column(String(50), nullable=False)  # password_reset, phone_verification
    
    # Status
    is_used = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=3)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)

class LoginAttempt(Base):
    __tablename__ = "login_attempts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), nullable=False)
    ip_address = Column(String(45), nullable=False)
    user_agent = Column(String(500), nullable=True)
    
    # Attempt details
    success = Column(Boolean, nullable=False)
    failure_reason = Column(String(100), nullable=True)
    method = Column(String(20), nullable=False)  # password, google, github
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
