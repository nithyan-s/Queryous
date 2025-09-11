import os
import httpx
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models import User, OTPVerification, LoginAttempt, ChatSession, UserPreference
from auth_utils import (
    get_password_hash, verify_password, create_access_token, create_refresh_token,
    verify_token, generate_otp, send_sms_otp, validate_email, validate_phone_number,
    format_phone_number, create_user_session_data, extract_ip_address,
    DEFAULT_USER_PREFERENCES
)
from auth_schemas import UserRegistration, UserLogin, PhoneVerification, OTPVerification

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def register_user(self, user_data: UserRegistration, request = None) -> Tuple[User, Dict[str, str]]:
        """Register a new user with email and password."""
        # Check if user already exists
        existing_user = self.db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            phone_number=format_phone_number(user_data.phone_number) if user_data.phone_number else None,
            preferences=DEFAULT_USER_PREFERENCES.copy()
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        # Create default user preferences
        preferences = UserPreference(
            user_id=user.id,
            **DEFAULT_USER_PREFERENCES
        )
        self.db.add(preferences)
        self.db.commit()
        
        # Log registration attempt
        if request:
            self._log_login_attempt(
                email=user.email,
                success=True,
                method="email",
                ip_address=extract_ip_address(request),
                user_agent=request.headers.get("User-Agent")
            )
        
        # Generate tokens
        tokens = self._generate_user_tokens(user)
        
        return user, tokens

    def authenticate_user(self, credentials: UserLogin, request = None) -> Tuple[User, Dict[str, str]]:
        """Authenticate user with email and password."""
        user = self.db.query(User).filter(User.email == credentials.email).first()
        
        # Log attempt
        ip_address = extract_ip_address(request) if request else "unknown"
        user_agent = request.headers.get("User-Agent") if request else None
        
        if not user or not verify_password(credentials.password, user.hashed_password):
            self._log_login_attempt(
                email=credentials.email,
                success=False,
                method="email",
                failure_reason="invalid_credentials",
                ip_address=ip_address,
                user_agent=user_agent
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not user.is_active:
            self._log_login_attempt(
                email=credentials.email,
                success=False,
                method="email",
                failure_reason="account_disabled",
                ip_address=ip_address,
                user_agent=user_agent
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled"
            )
        
        # Update last login
        user.last_login = datetime.utcnow()
        self.db.commit()
        
        # Log successful attempt
        self._log_login_attempt(
            email=credentials.email,
            success=True,
            method="email",
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Generate tokens
        tokens = self._generate_user_tokens(user)
        
        return user, tokens

    async def oauth_login(self, provider: str, code: str, request = None) -> Tuple[User, Dict[str, str]]:
        """Handle OAuth login/registration."""
        if provider == "google":
            user_info = await self._get_google_user_info(code)
        elif provider == "github":
            user_info = await self._get_github_user_info(code)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported OAuth provider"
            )
        
        # Check if user exists
        user = self.db.query(User).filter(User.email == user_info["email"]).first()
        
        if user:
            # Update OAuth info if not set
            if provider == "google" and not user.google_id:
                user.google_id = user_info["id"]
            elif provider == "github" and not user.github_id:
                user.github_id = user_info["id"]
            
            # Update avatar if available
            if user_info.get("avatar_url") and not user.avatar_url:
                user.avatar_url = user_info["avatar_url"]
            
            user.last_login = datetime.utcnow()
        else:
            # Create new user
            user = User(
                email=user_info["email"],
                full_name=user_info.get("name"),
                avatar_url=user_info.get("avatar_url"),
                is_email_verified=True,  # OAuth emails are pre-verified
                preferences=DEFAULT_USER_PREFERENCES.copy()
            )
            
            if provider == "google":
                user.google_id = user_info["id"]
            elif provider == "github":
                user.github_id = user_info["id"]
            
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            
            # Create default preferences
            preferences = UserPreference(
                user_id=user.id,
                **DEFAULT_USER_PREFERENCES
            )
            self.db.add(preferences)
        
        self.db.commit()
        
        # Log OAuth attempt
        if request:
            self._log_login_attempt(
                email=user.email,
                success=True,
                method=provider,
                ip_address=extract_ip_address(request),
                user_agent=request.headers.get("User-Agent")
            )
        
        # Generate tokens
        tokens = self._generate_user_tokens(user)
        
        return user, tokens

    def send_password_reset_otp(self, phone_data: PhoneVerification) -> bool:
        """Send OTP for password reset."""
        phone_number = format_phone_number(phone_data.phone_number)
        
        # Check if user exists with this phone number
        user = self.db.query(User).filter(User.phone_number == phone_number).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this phone number"
            )
        
        # Generate and save OTP
        otp_code = generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        
        # Remove any existing OTPs for this phone
        self.db.query(OTPVerification).filter(
            OTPVerification.phone_number == phone_number,
            OTPVerification.purpose == "password_reset"
        ).delete()
        
        otp_record = OTPVerification(
            phone_number=phone_number,
            otp_code=otp_code,
            purpose="password_reset",
            expires_at=expires_at
        )
        
        self.db.add(otp_record)
        self.db.commit()
        
        # Send SMS
        success = send_sms_otp(phone_number, otp_code, "password reset")
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send SMS. Please try again."
            )
        
        return True

    def verify_otp_and_reset_password(self, reset_data: 'PasswordReset') -> bool:
        """Verify OTP and reset password."""
        phone_number = format_phone_number(reset_data.phone_number)
        
        # Find OTP record
        otp_record = self.db.query(OTPVerification).filter(
            OTPVerification.phone_number == phone_number,
            OTPVerification.otp_code == reset_data.otp_code,
            OTPVerification.purpose == "password_reset",
            OTPVerification.is_used == False,
            OTPVerification.expires_at > datetime.utcnow()
        ).first()
        
        if not otp_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP"
            )
        
        # Check attempts
        if otp_record.attempts >= otp_record.max_attempts:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many OTP attempts. Request a new code."
            )
        
        # Find user
        user = self.db.query(User).filter(User.phone_number == phone_number).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update password
        user.hashed_password = get_password_hash(reset_data.new_password)
        
        # Mark OTP as used
        otp_record.is_used = True
        otp_record.used_at = datetime.utcnow()
        
        self.db.commit()
        
        return True

    def refresh_token(self, refresh_token: str) -> Dict[str, str]:
        """Refresh access token using refresh token."""
        payload = verify_token(refresh_token, token_type="refresh")
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user = self.db.query(User).filter(User.id == payload["sub"]).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        return self._generate_user_tokens(user)

    def get_user_by_token(self, token: str) -> Optional[User]:
        """Get user from access token."""
        payload = verify_token(token, token_type="access")
        if not payload:
            return None
        
        user = self.db.query(User).filter(User.id == payload["sub"]).first()
        return user if user and user.is_active else None

    def _generate_user_tokens(self, user: User) -> Dict[str, str]:
        """Generate access and refresh tokens for user."""
        token_data = {"sub": user.id, "email": user.email}
        
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 1800  # 30 minutes
        }

    def _log_login_attempt(self, email: str, success: bool, method: str, 
                          ip_address: str = "unknown", user_agent: str = None,
                          failure_reason: str = None):
        """Log login attempt."""
        attempt = LoginAttempt(
            email=email,
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
            method=method,
            failure_reason=failure_reason
        )
        
        self.db.add(attempt)
        self.db.commit()

    async def _get_google_user_info(self, code: str) -> Dict[str, Any]:
        """Get user info from Google OAuth."""
        # Exchange code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/auth/callback/google"
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data)
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange code for token"
                )
            
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            
            # Get user info
            user_info_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"
            user_response = await client.get(user_info_url)
            if user_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user info"
                )
            
            user_info = user_response.json()
            return {
                "id": user_info["id"],
                "email": user_info["email"],
                "name": user_info.get("name"),
                "avatar_url": user_info.get("picture")
            }

    async def _get_github_user_info(self, code: str) -> Dict[str, Any]:
        """Get user info from GitHub OAuth."""
        # Exchange code for tokens
        token_url = "https://github.com/login/oauth/access_token"
        token_data = {
            "client_id": os.getenv("GITHUB_CLIENT_ID"),
            "client_secret": os.getenv("GITHUB_CLIENT_SECRET"),
            "code": code
        }
        
        headers = {"Accept": "application/json"}
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data, headers=headers)
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange code for token"
                )
            
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            
            # Get user info
            user_headers = {"Authorization": f"Bearer {access_token}"}
            user_response = await client.get("https://api.github.com/user", headers=user_headers)
            if user_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user info"
                )
            
            user_info = user_response.json()
            
            # Get primary email if not public
            email = user_info.get("email")
            if not email:
                emails_response = await client.get("https://api.github.com/user/emails", headers=user_headers)
                if emails_response.status_code == 200:
                    emails = emails_response.json()
                    primary_email = next((e for e in emails if e["primary"]), None)
                    if primary_email:
                        email = primary_email["email"]
            
            return {
                "id": str(user_info["id"]),
                "email": email,
                "name": user_info.get("name"),
                "avatar_url": user_info.get("avatar_url")
            }
