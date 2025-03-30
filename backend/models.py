
import os
from sqlalchemy import create_engine, Column, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///secure_chat.db')

if DATABASE_URL and DATABASE_URL.startswith('postgres:'):
    DATABASE_URL = DATABASE_URL.replace('postgres:', 'postgresql:', 1)


print(f"Using DATABASE_URL: {DATABASE_URL}")
print(f"Using DATABASE_URL: {DATABASE_URL}")

# Create SQLAlchemy engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base model class
Base = declarative_base()

class User(Base):
    """Anonymous user model with only public key and access code hash"""
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True)  # UUID
    public_key = Column(Text, nullable=False)  # Public key (PEM format)
    access_code_hash = Column(String(128), nullable=False, unique=True)  # Hashed access code
    display_name = Column(String(50), nullable=True)  # Optional display name
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_active = Column(DateTime, default=datetime.datetime.utcnow)
    is_online = Column(Boolean, default=False)

class Message(Base):
    """Encrypted message model"""
    __tablename__ = "messages"
    
    id = Column(String(36), primary_key=True)  # UUID
    sender_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    recipient_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    encrypted_content = Column(Text, nullable=False)  # Encrypted message content
    encrypted_key = Column(Text, nullable=False)  # Encrypted AES key
    signature = Column(Text, nullable=False)  # Digital signature
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationship to users
    sender = relationship("User", foreign_keys=[sender_id], backref="sent_messages")
    recipient = relationship("User", foreign_keys=[recipient_id], backref="received_messages")

def init_db():
    """Initialize the database by creating all tables"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Get a database session"""
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()