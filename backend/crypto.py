from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import os
import base64
import json
import datetime
import secrets

class CryptoManager:
    """
    Manages cryptographic operations for secure messaging:
    - Key generation (RSA for asymmetric, AES for symmetric)
    - Message encryption/decryption
    - Signatures for message integrity
    """
    
    @staticmethod
    def generate_rsa_keypair():
        """Generate a new RSA key pair for asymmetric encryption"""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        public_key = private_key.public_key()
        
        # Serialize keys for storage/transmission
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        
        return {
            'private_key': private_pem.decode('utf-8'),
            'public_key': public_pem.decode('utf-8')
        }
    
    @staticmethod
    def load_rsa_key(key_string, is_private=True):
        """Load an RSA key from its string representation"""
        if is_private:
            return serialization.load_pem_private_key(
                key_string.encode('utf-8'),
                password=None,
                backend=default_backend()
            )
        else:
            return serialization.load_pem_public_key(
                key_string.encode('utf-8'),
                backend=default_backend()
            )
    
    @staticmethod
    def generate_aes_key():
        """Generate a random AES key for symmetric encryption"""
        return os.urandom(32)  # 256-bit key
    
    @staticmethod
    def encrypt_with_rsa(message, public_key_str):
        """Encrypt data using RSA public key"""
        public_key = CryptoManager.load_rsa_key(public_key_str, is_private=False)
        
        encrypted = public_key.encrypt(
            message,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        return base64.b64encode(encrypted).decode('utf-8')
    
    @staticmethod
    def decrypt_with_rsa(encrypted_message, private_key_str):
        """Decrypt data using RSA private key"""
        private_key = CryptoManager.load_rsa_key(private_key_str, is_private=True)
        encrypted_bytes = base64.b64decode(encrypted_message.encode('utf-8'))
        
        decrypted = private_key.decrypt(
            encrypted_bytes,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        return decrypted
    
    @staticmethod
    def encrypt_with_aes(message, key):
        """Encrypt data using AES key"""
        # Generate a random IV
        iv = os.urandom(16)
        
        # Create an encryptor object
        cipher = Cipher(
            algorithms.AES(key),
            modes.CFB(iv),
            backend=default_backend()
        )
        encryptor = cipher.encryptor()
        
        # Encrypt the message
        ciphertext = encryptor.update(message.encode('utf-8')) + encryptor.finalize()
        
        # Return IV and ciphertext
        result = {
            'iv': base64.b64encode(iv).decode('utf-8'),
            'ciphertext': base64.b64encode(ciphertext).decode('utf-8')
        }
        
        return result
    
    @staticmethod
    def decrypt_with_aes(encrypted_data, key):
        """Decrypt data using AES key"""
        # Extract IV and ciphertext
        iv = base64.b64decode(encrypted_data['iv'].encode('utf-8'))
        ciphertext = base64.b64decode(encrypted_data['ciphertext'].encode('utf-8'))
        
        # Create a decryptor object
        cipher = Cipher(
            algorithms.AES(key),
            modes.CFB(iv),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()
        
        # Decrypt the ciphertext
        plaintext = decryptor.update(ciphertext) + decryptor.finalize()
        
        return plaintext.decode('utf-8')
    
    @staticmethod
    def sign_message(message, private_key_str):
        """Create a digital signature for a message"""
        private_key = CryptoManager.load_rsa_key(private_key_str, is_private=True)
        
        signature = private_key.sign(
            message.encode('utf-8'),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        
        return base64.b64encode(signature).decode('utf-8')
    
    @staticmethod
    def verify_signature(message, signature, public_key_str):
        """Verify a message's digital signature"""
        public_key = CryptoManager.load_rsa_key(public_key_str, is_private=False)
        signature_bytes = base64.b64decode(signature.encode('utf-8'))
        
        try:
            public_key.verify(
                signature_bytes,
                message.encode('utf-8'),
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return True
        except Exception:
            return False
    
    @staticmethod
    def prepare_message(sender_id, recipient_id, message_text, sender_private_key, recipient_public_key):
        """
        Prepare a secure message for sending:
        1. Generate a one-time AES key
        2. Encrypt the message with AES
        3. Encrypt the AES key with recipient's RSA public key
        4. Sign the encrypted message with sender's RSA private key
        """
        # Generate a one-time symmetric key for this message
        aes_key = CryptoManager.generate_aes_key()
        
        # Encrypt the message with AES
        encrypted_message = CryptoManager.encrypt_with_aes(message_text, aes_key)
        
        # Convert message to JSON string for signing
        message_json = json.dumps(encrypted_message)
        
        # Sign the encrypted message
        signature = CryptoManager.sign_message(message_json, sender_private_key)
        
        # Encrypt the AES key with the recipient's public key
        encrypted_key = CryptoManager.encrypt_with_rsa(aes_key, recipient_public_key)
        
        # Prepare the final message package
        secure_message = {
            'sender_id': sender_id,
            'recipient_id': recipient_id,
            'encrypted_message': encrypted_message,
            'encrypted_key': encrypted_key,
            'signature': signature,
            'timestamp': datetime.datetime.now().isoformat()
        }
        
        return secure_message
    
    @staticmethod
    def decrypt_message(secure_message, recipient_private_key, sender_public_key):
        """
        Decrypt a secure message:
        1. Verify the signature using sender's public key
        2. Decrypt the AES key using recipient's private key
        3. Decrypt the message using the AES key
        """
        # Convert encrypted message to JSON for signature verification
        message_json = json.dumps(secure_message['encrypted_message'])
        
        # Verify the signature
        is_authentic = CryptoManager.verify_signature(
            message_json,
            secure_message['signature'],
            sender_public_key
        )
        
        if not is_authentic:
            raise ValueError("Message signature verification failed")
        
        # Decrypt the AES key
        encrypted_key = secure_message['encrypted_key']
        aes_key = CryptoManager.decrypt_with_rsa(encrypted_key, recipient_private_key)
        
        # Decrypt the message with the AES key
        decrypted_message = CryptoManager.decrypt_with_aes(
            secure_message['encrypted_message'],
            aes_key
        )
        
        return {
            'sender_id': secure_message['sender_id'],
            'text': decrypted_message,
            'timestamp': secure_message['timestamp']
        }