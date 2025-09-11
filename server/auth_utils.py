import os
import secrets
import random
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from jose import JWTError, jwt
from twilio.rest import Client
from fastapi import HTTPException, status
import re

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Twilio configuration for SMS
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

# OAuth configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != token_type:
            return None
        return payload
    except JWTError:
        return None

def generate_otp() -> str:
    """Generate a 6-digit OTP."""
    return str(random.randint(100000, 999999))

def send_sms_otp(phone_number: str, otp_code: str, purpose: str = "verification") -> bool:
    """Send OTP via SMS using Twilio."""
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
        print("Twilio credentials not configured")
        return False
    
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        message_body = f"Your Queryous {purpose} code is: {otp_code}. Valid for 10 minutes."
        
        message = client.messages.create(
            body=message_body,
            from_=TWILIO_PHONE_NUMBER,
            to=phone_number
        )
        
        print(f"SMS sent successfully. SID: {message.sid}")
        return True
    except Exception as e:
        print(f"Failed to send SMS: {str(e)}")
        return False

def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone_number(phone: str) -> bool:
    """Validate phone number format (international)."""
    # Remove all non-digit characters
    cleaned = re.sub(r'\D', '', phone)
    # Check if it's a valid international format (10-15 digits)
    return len(cleaned) >= 10 and len(cleaned) <= 15

def format_phone_number(phone: str) -> str:
    """Format phone number to international format."""
    cleaned = re.sub(r'\D', '', phone)
    if not cleaned.startswith('+'):
        if len(cleaned) == 10:  # US number without country code
            cleaned = '+1' + cleaned
        elif not cleaned.startswith('1') and len(cleaned) == 10:
            cleaned = '+1' + cleaned
        else:
            cleaned = '+' + cleaned
    return cleaned

def validate_password_strength(password: str) -> Dict[str, Any]:
    """Validate password strength and return requirements."""
    requirements = {
        "min_length": len(password) >= 8,
        "has_uppercase": bool(re.search(r'[A-Z]', password)),
        "has_lowercase": bool(re.search(r'[a-z]', password)),
        "has_digit": bool(re.search(r'\d', password)),
        "has_special": bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password)),
    }
    
    is_strong = all(requirements.values())
    
    return {
        "is_strong": is_strong,
        "requirements": requirements,
        "score": sum(requirements.values()),
        "max_score": len(requirements)
    }

def create_user_session_data(user) -> Dict[str, Any]:
    """Create session data for authenticated user."""
    return {
        "user_id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "is_premium": user.is_premium,
        "preferences": user.preferences or {},
        "last_login": user.last_login.isoformat() if user.last_login else None
    }

def get_oauth_redirect_url(provider: str, state: str = None) -> str:
    """Generate OAuth redirect URL for provider."""
    if provider == "google":
        base_url = "https://accounts.google.com/o/oauth2/v2/auth"
        params = {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/auth/callback/google",
            "scope": "openid email profile",
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent"
        }
        if state:
            params["state"] = state
            
    elif provider == "github":
        base_url = "https://github.com/login/oauth/authorize"
        params = {
            "client_id": GITHUB_CLIENT_ID,
            "redirect_uri": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/auth/callback/github",
            "scope": "user:email",
            "response_type": "code"
        }
        if state:
            params["state"] = state
    else:
        raise ValueError(f"Unsupported OAuth provider: {provider}")
    
    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    return f"{base_url}?{query_string}"

def extract_ip_address(request) -> str:
    """Extract IP address from request."""
    # Check for forwarded IP first (in case of proxy)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    return request.client.host if request.client else "unknown"

def is_rate_limited(email: str, max_attempts: int = 5, time_window: int = 300) -> bool:
    """Check if user has exceeded login attempts (simple in-memory rate limiting)."""
    # In production, this should use Redis or database
    # For now, this is a placeholder that always returns False
    return False

# Default user preferences
DEFAULT_USER_PREFERENCES = {
    "theme": "dark",
    "sidebar_collapsed": False,
    "dashboard_layout": "grid",
    "charts_per_row": 2,
    "auto_save_chats": True,
    "chat_suggestions": True,
    "voice_input_enabled": True,
    "default_chart_type": "auto",
    "max_rows_display": 100,
    "export_format": "csv",
    "email_notifications": True,
    "sms_notifications": False
}
