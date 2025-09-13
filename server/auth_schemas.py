from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserSignup(BaseModel):
    """Schema for user signup."""
    username: str
    password: str

class UserLogin(BaseModel):
    """Schema for user login."""
    username: str
    password: str

class UserProfile(BaseModel):
    """Schema for user profile."""
    username: str
    created_at: str

class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str
    expires_in: int
    user: UserProfile

class DBCredentials(BaseModel):
    """Schema for database credentials."""
    host: str
    port: int
    user: str
    password: str
    db_name: str
