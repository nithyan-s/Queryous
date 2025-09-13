import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from passlib.context import CryptContext
from jose import JWTError, jwt

from auth_schemas import UserSignup, UserLogin, DBCredentials

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

class AuthService:
    """Simple in-memory authentication service with JWT tokens."""
    
    def __init__(self):
        # In-memory user storage (replace with database in production)
        self.users: Dict[str, Dict[str, Any]] = {}
        # In-memory database credentials storage
        self.db_credentials: Dict[str, DBCredentials] = {}
    
    def _hash_password(self, password: str) -> str:
        """Hash a password using bcrypt."""
        return pwd_context.hash(password)
    
    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return pwd_context.verify(plain_password, hashed_password)
    
    def _create_access_token(self, data: dict) -> str:
        """Create a JWT access token."""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
        return encoded_jwt
    
    def _verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify a JWT token and return the payload."""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            if username is None:
                return None
            return payload
        except JWTError:
            return None
    
    def create_user(self, user_data: UserSignup) -> Tuple[Dict[str, Any], str]:
        """Create a new user."""
        # Check if user already exists
        if user_data.username in self.users:
            raise ValueError("Username already exists")
        
        # Validate password length
        if len(user_data.password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        # Create user
        hashed_password = self._hash_password(user_data.password)
        user = {
            "username": user_data.username,
            "hashed_password": hashed_password,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Store user
        self.users[user_data.username] = user
        
        # Create access token
        token_data = {"sub": user_data.username}
        access_token = self._create_access_token(token_data)
        
        return user, access_token
    
    def authenticate_user(self, credentials: UserLogin) -> Tuple[Dict[str, Any], str]:
        """Authenticate a user and return user data and token."""
        # Check if user exists
        user = self.users.get(credentials.username)
        if not user:
            raise ValueError("Invalid username or password")
        
        # Verify password
        if not self._verify_password(credentials.password, user["hashed_password"]):
            raise ValueError("Invalid username or password")
        
        # Create access token
        token_data = {"sub": credentials.username}
        access_token = self._create_access_token(token_data)
        
        return user, access_token
    
    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Get user data from a JWT token."""
        payload = self._verify_token(token)
        if not payload:
            return None
        
        username = payload.get("sub")
        if not username:
            return None
        
        return self.users.get(username)
    
    def store_db_credentials(self, username: str, credentials: DBCredentials) -> None:
        """Store database credentials for a user."""
        self.db_credentials[username] = credentials
    
    def get_db_credentials(self, username: str) -> Optional[DBCredentials]:
        """Get stored database credentials for a user."""
        return self.db_credentials.get(username)
