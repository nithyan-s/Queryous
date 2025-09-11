from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from db import get_db
from models import User, UserPreference, ChatSession, Dashboard
from auth_service import AuthService
from auth_schemas import (
    UserRegistration, UserLogin, OAuthCallback, PhoneVerification, 
    OTPVerification, PasswordReset, Token, UserProfile, UserPreferences,
    AuthResponse, OTPResponse, UserStats, AuthConfig, OAuthProvider
)
from auth_utils import get_oauth_redirect_url

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    auth_service = AuthService(db)
    user = auth_service.get_user_by_token(credentials.credentials)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, otherwise None."""
    if not credentials:
        return None
    
    auth_service = AuthService(db)
    return auth_service.get_user_by_token(credentials.credentials)

@router.post("/register", response_model=Token)
async def register(
    user_data: UserRegistration,
    request: Request,
    db: Session = Depends(get_db)
):
    """Register a new user with email and password."""
    auth_service = AuthService(db)
    user, tokens = auth_service.register_user(user_data, request)
    
    return Token(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type=tokens["token_type"],
        expires_in=tokens["expires_in"],
        user=UserProfile(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            phone_number=user.phone_number,
            avatar_url=user.avatar_url,
            is_premium=user.is_premium,
            is_email_verified=user.is_email_verified,
            is_phone_verified=user.is_phone_verified,
            created_at=user.created_at,
            last_login=user.last_login,
            preferences=user.preferences or {}
        )
    )

@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    """Login with email and password."""
    auth_service = AuthService(db)
    user, tokens = auth_service.authenticate_user(credentials, request)
    
    return Token(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type=tokens["token_type"],
        expires_in=tokens["expires_in"],
        user=UserProfile(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            phone_number=user.phone_number,
            avatar_url=user.avatar_url,
            is_premium=user.is_premium,
            is_email_verified=user.is_email_verified,
            is_phone_verified=user.is_phone_verified,
            created_at=user.created_at,
            last_login=user.last_login,
            preferences=user.preferences or {}
        )
    )

@router.get("/oauth/{provider}")
async def oauth_login(provider: str):
    """Initiate OAuth login with Google or GitHub."""
    if provider not in ["google", "github"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported OAuth provider"
        )
    
    # Generate state for CSRF protection
    import secrets
    state = secrets.token_urlsafe(32)
    
    auth_url = get_oauth_redirect_url(provider, state)
    
    return {
        "auth_url": auth_url,
        "state": state
    }

@router.post("/oauth/{provider}/callback", response_model=Token)
async def oauth_callback(
    provider: str,
    callback_data: OAuthCallback,
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle OAuth callback from Google or GitHub."""
    if provider not in ["google", "github"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported OAuth provider"
        )
    
    auth_service = AuthService(db)
    user, tokens = await auth_service.oauth_login(provider, callback_data.code, request)
    
    return Token(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type=tokens["token_type"],
        expires_in=tokens["expires_in"],
        user=UserProfile(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            phone_number=user.phone_number,
            avatar_url=user.avatar_url,
            is_premium=user.is_premium,
            is_email_verified=user.is_email_verified,
            is_phone_verified=user.is_phone_verified,
            created_at=user.created_at,
            last_login=user.last_login,
            preferences=user.preferences or {}
        )
    )

@router.post("/forgot-password", response_model=OTPResponse)
async def forgot_password(
    phone_data: PhoneVerification,
    db: Session = Depends(get_db)
):
    """Send OTP for password reset."""
    auth_service = AuthService(db)
    success = auth_service.send_password_reset_otp(phone_data)
    
    if success:
        return OTPResponse(
            success=True,
            message="OTP sent to your phone number",
            expires_in=600
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP"
        )

@router.post("/reset-password", response_model=AuthResponse)
async def reset_password(
    reset_data: PasswordReset,
    db: Session = Depends(get_db)
):
    """Reset password using OTP verification."""
    auth_service = AuthService(db)
    success = auth_service.verify_otp_and_reset_password(reset_data)
    
    if success:
        return AuthResponse(
            success=True,
            message="Password reset successfully"
        )

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_data: dict,
    db: Session = Depends(get_db)
):
    """Refresh access token."""
    refresh_token = refresh_data.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token required"
        )
    
    auth_service = AuthService(db)
    tokens = auth_service.refresh_token(refresh_token)
    
    # Get user info for response
    user = auth_service.get_user_by_token(tokens["access_token"])
    
    return Token(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type=tokens["token_type"],
        expires_in=tokens["expires_in"],
        user=UserProfile(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            phone_number=user.phone_number,
            avatar_url=user.avatar_url,
            is_premium=user.is_premium,
            is_email_verified=user.is_email_verified,
            is_phone_verified=user.is_phone_verified,
            created_at=user.created_at,
            last_login=user.last_login,
            preferences=user.preferences or {}
        )
    )

@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user profile."""
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        phone_number=current_user.phone_number,
        avatar_url=current_user.avatar_url,
        is_premium=current_user.is_premium,
        is_email_verified=current_user.is_email_verified,
        is_phone_verified=current_user.is_phone_verified,
        created_at=current_user.created_at,
        last_login=current_user.last_login,
        preferences=current_user.preferences or {}
    )

@router.get("/preferences", response_model=UserPreferences)
async def get_user_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user preferences."""
    preferences = db.query(UserPreference).filter(
        UserPreference.user_id == current_user.id
    ).first()
    
    if not preferences:
        # Create default preferences
        from auth_utils import DEFAULT_USER_PREFERENCES
        preferences = UserPreference(
            user_id=current_user.id,
            **DEFAULT_USER_PREFERENCES
        )
        db.add(preferences)
        db.commit()
        db.refresh(preferences)
    
    return UserPreferences(
        theme=preferences.theme,
        sidebar_collapsed=preferences.sidebar_collapsed,
        dashboard_layout=preferences.dashboard_layout,
        charts_per_row=preferences.charts_per_row,
        auto_save_chats=preferences.auto_save_chats,
        chat_suggestions=preferences.chat_suggestions,
        voice_input_enabled=preferences.voice_input_enabled,
        default_chart_type=preferences.default_chart_type,
        max_rows_display=preferences.max_rows_display,
        export_format=preferences.export_format,
        email_notifications=preferences.email_notifications,
        sms_notifications=preferences.sms_notifications
    )

@router.put("/preferences", response_model=UserPreferences)
async def update_user_preferences(
    preferences_data: UserPreferences,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user preferences."""
    preferences = db.query(UserPreference).filter(
        UserPreference.user_id == current_user.id
    ).first()
    
    if not preferences:
        preferences = UserPreference(user_id=current_user.id)
        db.add(preferences)
    
    # Update preferences
    for field, value in preferences_data.dict().items():
        setattr(preferences, field, value)
    
    # Also update user preferences JSON field for backward compatibility
    current_user.preferences = preferences_data.dict()
    
    db.commit()
    db.refresh(preferences)
    
    return preferences_data

@router.get("/stats", response_model=UserStats)
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user statistics."""
    total_chats = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).count()
    total_dashboards = db.query(Dashboard).filter(Dashboard.user_id == current_user.id).count()
    
    favorite_chats = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id,
        ChatSession.is_favorite == True
    ).count()
    
    favorite_dashboards = db.query(Dashboard).filter(
        Dashboard.user_id == current_user.id,
        Dashboard.is_favorite == True
    ).count()
    
    public_dashboards = db.query(Dashboard).filter(
        Dashboard.user_id == current_user.id,
        Dashboard.is_public == True
    ).count()
    
    # Calculate total queries from chat sessions
    chat_sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).all()
    total_queries = sum(len(session.messages or []) // 2 for session in chat_sessions)  # Divide by 2 for user messages only
    
    return UserStats(
        total_chats=total_chats,
        total_dashboards=total_dashboards,
        favorite_chats=favorite_chats,
        favorite_dashboards=favorite_dashboards,
        public_dashboards=public_dashboards,
        total_queries=total_queries,
        last_activity=current_user.last_login
    )

@router.get("/config", response_model=AuthConfig)
async def get_auth_config():
    """Get authentication configuration."""
    import os
    
    providers = []
    
    # Google OAuth
    if os.getenv("GOOGLE_CLIENT_ID"):
        providers.append(OAuthProvider(
            name="google",
            display_name="Google",
            icon="google",
            auth_url="/auth/oauth/google",
            is_enabled=True
        ))
    
    # GitHub OAuth
    if os.getenv("GITHUB_CLIENT_ID"):
        providers.append(OAuthProvider(
            name="github",
            display_name="GitHub",
            icon="github",
            auth_url="/auth/oauth/github",
            is_enabled=True
        ))
    
    return AuthConfig(
        providers=providers,
        features={
            "email_registration": True,
            "oauth_login": len(providers) > 0,
            "phone_verification": bool(os.getenv("TWILIO_ACCOUNT_SID")),
            "password_reset": bool(os.getenv("TWILIO_ACCOUNT_SID")),
            "two_factor_auth": False  # Can be enabled later
        },
        limits={
            "max_login_attempts": 5,
            "otp_expiry_minutes": 10,
            "password_min_length": 8,
            "max_dashboards_free": 10,
            "max_chats_free": 50
        }
    )

@router.post("/logout")
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user)
):
    """Logout user (client should remove tokens)."""
    # In a production system, you might want to blacklist the token
    # For now, we'll just return success and let the client handle token removal
    
    return AuthResponse(
        success=True,
        message="Logged out successfully"
    )
