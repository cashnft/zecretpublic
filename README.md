# Zecret End to End Encrypted Anonymous Chat

Zecret is a secure messaging platform that provides end to end encryption with forward secrecy and message integrity verification.

## How It Works

### Security Implementation
- **End to End Encryption**: All messages are encrypted on the senders device and can only be decrypted by the intended recipient
- **Hybrid Cryptography**:
  - RSA (2048-bit) for key exchange and digital signatures
  - AES (256-bit) for message content encryption
- **Forward Secrecy**: Each message uses a new random AES key, ensuring that compromise of one message doesnt expose others
- **Message Integrity**: Digital signatures verify that messages haven't been tampered with in transit
- **Anonymous Identity**: No personal information required to use the platform

### Technical Architecture
- **Frontend**: React with Tailwind CSS
- **Backend**: Flask with Socket for real time communication
- **Database**: Postgresql for message and user storage

## Security Flow
1. User creates an anonymous identity, generating an RSA key pair
2. User receives an access code and private key stored only in the browser
3. When sending a message:
   - A unique AES key is generated
   - The message is encrypted with this AES key
   - The AES key is encrypted with the recipiens public key
   - The encrypted message is signed with the senders private key
4. The server routes the encrypted message without being able to read its contents
5. The recipient decrypts the AES key using their private key, then decrypts the message

## Running the Application
- **Demo**: Visit [Zecret](https://zecret.vercel.app)

## Video Demo

[▶️ Watch the video demo](./demo.mp4)
