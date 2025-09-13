from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
import os
from datetime import datetime, timedelta

from auth_service import AuthService
from auth_schemas import UserSignup, UserLogin, Token, UserProfile, DBCredentials

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

# Initialize auth service
auth_service = AuthService()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """Get current authenticated user from JWT token."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = auth_service.get_user_by_token(credentials.credentials)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

@router.post("/signup", response_model=Token)
async def signup(user_data: UserSignup):
    """Register a new user with username and password."""
    try:
        user, token = auth_service.create_user(user_data)
        
        return Token(
            access_token=token,
            token_type="bearer",
            expires_in=3600,  # 1 hour
            user=UserProfile(
                username=user["username"],
                created_at=user["created_at"]
            )
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login with username and password."""
    try:
        user, token = auth_service.authenticate_user(credentials)
        
        return Token(
            access_token=token,
            token_type="bearer",
            expires_in=3600,  # 1 hour
            user=UserProfile(
                username=user["username"],
                created_at=user["created_at"]
            )
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to authenticate user"
        )

@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get current user profile."""
    return UserProfile(
        username=current_user["username"],
        created_at=current_user["created_at"]
    )

@router.post("/store-db-credentials")
async def store_db_credentials(
    credentials: DBCredentials,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Store database credentials for the authenticated user."""
    try:
        auth_service.store_db_credentials(current_user["username"], credentials)
        return {
            "message": "Database credentials stored successfully",
            "success": True
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store database credentials"
        )

@router.get("/get-db-credentials", response_model=DBCredentials)
async def get_db_credentials(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get stored database credentials for the authenticated user."""
    try:
        credentials = auth_service.get_db_credentials(current_user["username"])
        
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No database credentials found for user"
            )
        
        return credentials
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve database credentials"
        )

@router.post("/logout")
async def logout(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Logout user."""
    return {
        "message": "Logged out successfully",
        "success": True
    }
