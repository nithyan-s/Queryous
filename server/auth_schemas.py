from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class AuthProvider(str, Enum):
    EMAIL = "email"
    GOOGLE = "google"
    GITHUB = "github"

class Theme(str, Enum):
    LIGHT = "light"
    DARK = "dark"

class DashboardLayout(str, Enum):
    GRID = "grid"
    LIST = "list"

# Authentication Schemas
class UserRegistration(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class OAuthCallback(BaseModel):
    code: str
    state: Optional[str] = None

class PhoneVerification(BaseModel):
    phone_number: str
    
    @validator('phone_number')
    def validate_phone(cls, v):
        import re
        cleaned = re.sub(r'\D', '', v)
        if len(cleaned) < 10 or len(cleaned) > 15:
            raise ValueError('Invalid phone number format')
        return v

class OTPVerification(BaseModel):
    phone_number: str
    otp_code: str
    purpose: str = "verification"

class PasswordReset(BaseModel):
    phone_number: str
    otp_code: str
    new_password: str
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

# User Profile Schemas
class UserProfile(BaseModel):
    id: str
    email: str
    username: Optional[str]
    full_name: Optional[str]
    phone_number: Optional[str]
    avatar_url: Optional[str]
    is_premium: bool
    is_email_verified: bool
    is_phone_verified: bool
    created_at: datetime
    last_login: Optional[datetime]
    preferences: Dict[str, Any] = {}

class UserUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    
    @validator('phone_number')
    def validate_phone(cls, v):
        if v is not None:
            import re
            cleaned = re.sub(r'\D', '', v)
            if len(cleaned) < 10 or len(cleaned) > 15:
                raise ValueError('Invalid phone number format')
        return v

# Preferences Schemas
class UserPreferences(BaseModel):
    theme: Theme = Theme.DARK
    sidebar_collapsed: bool = False
    dashboard_layout: DashboardLayout = DashboardLayout.GRID
    charts_per_row: int = 2
    auto_save_chats: bool = True
    chat_suggestions: bool = True
    voice_input_enabled: bool = True
    default_chart_type: str = "auto"
    max_rows_display: int = 100
    export_format: str = "csv"
    email_notifications: bool = True
    sms_notifications: bool = False
    
    @validator('charts_per_row')
    def validate_charts_per_row(cls, v):
        if v < 1 or v > 4:
            raise ValueError('Charts per row must be between 1 and 4')
        return v
    
    @validator('max_rows_display')
    def validate_max_rows(cls, v):
        if v < 10 or v > 1000:
            raise ValueError('Max rows display must be between 10 and 1000')
        return v

# Chat Session Schemas
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = {}

class ChatSessionCreate(BaseModel):
    title: str = "New Chat"
    database_connection: Optional[Dict[str, Any]] = None

class ChatSessionUpdate(BaseModel):
    title: Optional[str] = None
    is_favorite: Optional[bool] = None
    tags: Optional[List[str]] = None

class ChatSession(BaseModel):
    id: str
    user_id: str
    title: str
    messages: List[ChatMessage] = []
    database_connection: Optional[Dict[str, Any]]
    is_favorite: bool
    tags: List[str] = []
    created_at: datetime
    updated_at: datetime

# Dashboard Schemas
class DashboardCreate(BaseModel):
    title: str
    description: Optional[str] = None
    data: Dict[str, Any]
    config: Dict[str, Any] = {}
    is_public: bool = False
    tags: List[str] = []

class DashboardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    config: Optional[Dict[str, Any]] = None
    is_public: Optional[bool] = None
    is_favorite: Optional[bool] = None
    tags: Optional[List[str]] = None

class Dashboard(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    data: Dict[str, Any]
    config: Dict[str, Any]
    is_public: bool
    is_favorite: bool
    tags: List[str]
    view_count: int
    share_token: Optional[str]
    created_at: datetime
    updated_at: datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserProfile

class TokenRefresh(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

# Response Schemas
class AuthResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class OTPResponse(BaseModel):
    success: bool
    message: str
    expires_in: int = 600  # 10 minutes

class UserStats(BaseModel):
    total_chats: int
    total_dashboards: int
    favorite_chats: int
    favorite_dashboards: int
    public_dashboards: int
    total_queries: int
    last_activity: Optional[datetime]

class UserActivity(BaseModel):
    id: str
    action: str  # "login", "chat_created", "dashboard_created", etc.
    details: Dict[str, Any]
    timestamp: datetime

# OAuth Provider Info
class OAuthProvider(BaseModel):
    name: str
    display_name: str
    icon: str
    auth_url: str
    is_enabled: bool

# System Configuration
class AuthConfig(BaseModel):
    providers: List[OAuthProvider]
    features: Dict[str, bool]
    limits: Dict[str, int]
