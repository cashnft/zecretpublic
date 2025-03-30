from crypto import CryptoManager
import jwt
import os
import uuid
import hashlib
import secrets
from datetime import datetime, timedelta
from models import User, get_db
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import update

class UserManager:
    """
    Manages anonymous users, sessions, and key pairs for the secure chat application.
    Removed all threading locks to avoid concurrency issues in multi-threaded environments.
    """
    
    def __init__(self, secret_key=None):
        """Initialize the user manager"""
        self.sessions = {}  # session_id -> user_id
        
        # For JWT token generation/validation
        self.secret_key = secret_key or os.urandom(24).hex()
    
    @staticmethod
    def _hash_access_code(access_code):
        """Hash an access code using SHA-256"""
        return hashlib.sha256(access_code.encode()).hexdigest()
    
    def register_anonymous_user(self, display_name=None):
        """
        Register a new anonymous user with a newly generated key pair
        Returns the user object and access code
        """
        # Generate RSA key pair
        keypair = CryptoManager.generate_rsa_keypair()
        
        # Generate a unique access code (combination of a random part and the private key hash)
        random_part = secrets.token_hex(8)
        private_key_hash = hashlib.sha256(keypair['private_key'].encode()).hexdigest()[:8]
        access_code = f"{random_part}-{private_key_hash}"
        
        # Hash the access code for storage
        access_code_hash = self._hash_access_code(access_code)
        
        # Create user object
        user_id = str(uuid.uuid4())
        
        db = get_db()
        try:
            new_user = User(
                id=user_id,
                public_key=keypair['public_key'],
                access_code_hash=access_code_hash,
                display_name=display_name
            )
            
            db.add(new_user)
            db.commit()
            
            return {
                'id': user_id,
                'public_key': keypair['public_key'],
                'display_name': display_name,
                'private_key': keypair['private_key'],
                'access_code': access_code
            }
            
        except SQLAlchemyError as e:
            db.rollback()
            raise e
        finally:
            db.close()
    
    def login_with_access_code(self, access_code):
        """
        Log in a user using their access code
        Returns the user object and tokens if successful, None otherwise
        """
        db = get_db()
        try:
            # Hash the access code
            access_code_hash = self._hash_access_code(access_code)
            
            # Find the user by access code hash
            user = db.query(User).filter(User.access_code_hash == access_code_hash).first()
            
            if not user:
                return None
            
            # Update last active time and online status
            user.last_active = datetime.utcnow()
            user.is_online = True
            db.commit()
            
            # Return the user info
            return {
                'id': user.id,
                'public_key': user.public_key,
                'display_name': user.display_name,
            }
            
        except SQLAlchemyError as e:
            db.rollback()
            raise e
        finally:
            db.close()
    
    def get_user(self, user_id):
        """Get a user by ID"""
        db = get_db()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return None
                
            return {
                'id': user.id,
                'public_key': user.public_key,
                'display_name': user.display_name,
                'is_online': user.is_online
            }
        finally:
            db.close()
    
    def get_public_key(self, user_id):
        """Get a user's public key"""
        db = get_db()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            return user.public_key if user else None
        finally:
            db.close()
    
    def create_session(self, user_id):
        """
        Create a new session for a user
        Returns a session token
        """
        # Get user to verify it exists
        user = self.get_user(user_id)
        if not user:
            return None
        
        # Create JWT token
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(days=1)
        }
        
        token = jwt.encode(payload, self.secret_key, algorithm='HS256')
        
        # Create session ID
        session_id = str(uuid.uuid4())
        
        # Store session without using locks
        self.sessions[session_id] = user_id
            
        # Update user's online status
        db = get_db()
        try:
            db_user = db.query(User).filter(User.id == user_id).first()
            if db_user:
                db_user.is_online = True
                db_user.last_active = datetime.utcnow()
                db.commit()
        except SQLAlchemyError as e:
            db.rollback()
            raise e
        finally:
            db.close()
        
        return {
            'token': token,
            'session_id': session_id,
            'user': user
        }
    
    def validate_token(self, token):
        """Validate a session token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def end_session(self, session_id):
        """End a user session"""
        # Get user ID before removing from sessions
        user_id = self.sessions.get(session_id)
        
        # Remove session
        if session_id in self.sessions:
            del self.sessions[session_id]
        
        if user_id:
            # Update user's online status
            db = get_db()
            try:
                db_user = db.query(User).filter(User.id == user_id).first()
                if db_user:
                    db_user.is_online = False
                    db_user.last_active = datetime.utcnow()
                    db.commit()
                    return True
            except SQLAlchemyError as e:
                db.rollback()
            finally:
                db.close()
        
        return False
    
    def get_online_users(self):
        """Get a list of online users"""
        db = get_db()
        try:
            online_users = db.query(User).filter(User.is_online == True).all()
            return [{
                'id': user.id,
                'display_name': user.display_name,
                'public_key': user.public_key
            } for user in online_users]
        finally:
            db.close()
            
    def get_user_by_id(self, user_id):
        """Get a user by ID"""
        db = get_db()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return None
                
            return {
                'id': user.id,
                'display_name': user.display_name,
                'public_key': user.public_key,
                'is_online': user.is_online
            }
        finally:
            db.close()
            
    def get_user_for_session(self, session_id):
        """Get the user associated with a session"""
        user_id = self.sessions.get(session_id)
        if user_id:
            return self.get_user(user_id)
        return None
        
    def update_display_name(self, user_id, display_name):
        """Update a user's display name"""
        db = get_db()
        try:
            db_user = db.query(User).filter(User.id == user_id).first()
            if db_user:
                db_user.display_name = display_name
                db.commit()
                return True
            return False
        except SQLAlchemyError as e:
            db.rollback()
            return False
        finally:
            db.close()