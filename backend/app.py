import eventlet
eventlet.monkey_patch()


from flask import Flask, request, jsonify
from flask_socketio import SocketIO, join_room, leave_room, emit, disconnect
from flask_cors import CORS
import os
import json
from dotenv import load_dotenv
from user_manager import UserManager
from crypto import CryptoManager
from models import init_db, Message, get_db
import functools
import uuid
from datetime import datetime
import traceback

# Load environment variables
load_dotenv()


# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', '3d6f45a5e1384ab23e9b68f5c3156739c6a7b1518694b92dbe55990bc6f2c9a6')




CORS(app, resources={r"/*": {"origins": [
    "https://zecret.vercel.app",
    "http://localhost:3000" ,
     "https://zecret-qxavsbcl0-cashnfts-projects.vercel.app" # For local development
]}})
allowed_origins = ["https://zecret.vercel.app","https://zecret-qxavsbcl0-cashnfts-projects.vercel.app", "http://localhost:3000"]
# Initialize Socket.IO
socketio = SocketIO(app, cors_allowed_origins=["https://zecret.vercel.app", "http://localhost:3000","https://zecret-qxavsbcl0-cashnfts-projects.vercel.app"])

# Initialize database
init_db()

# Initialize user manager
user_manager = UserManager(app.config['SECRET_KEY'])

# SocketIO session storage
socket_sessions = {}  # sid -> session_id

# Utility functions
def authenticated_only(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if request.sid not in socket_sessions:
            disconnect()
            return
        return f(*args, **kwargs)
    return wrapped

def get_user_from_socket(sid):
    """Get the user associated with a socket ID"""
    if sid in socket_sessions:
        session_id = socket_sessions[sid]
        return user_manager.get_user_for_session(session_id)
    return None
@app.errorhandler(Exception)
def handle_exception(e):
    app.logger.error(f"Unhandled exception: {str(e)}")
    app.logger.error(traceback.format_exc())
    return jsonify({'error': 'Internal server error. Please try again later.'}), 500
# REST API Routes
@app.route('/')
def index():
    return jsonify({'message': 'Secure Anonymous Chat API'})
@app.route('/', methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path=''):
    return app.make_default_options_response()
@app.route('/api/register', methods=['POST'])
def register():
    """Register a new anonymous user"""
    data = request.json
    display_name = data.get('display_name')
    
    try:
        user = user_manager.register_anonymous_user(display_name)
        
        # Create a session for the new user
        session = user_manager.create_session(user['id'])
        
        # Return necessary information to the client
        return jsonify({
            'message': 'Anonymous user registered successfully',
            'user': {
                'id': user['id'],
                'display_name': user['display_name'],
                'public_key': user['public_key']
            },
            'access_code': user['access_code'],  # This is the "password" they must save
            'private_key': user['private_key'],  # Client must save this for decryption
            'token': session['token']
        }), 201
    except Exception as e:
        app.logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Log in with an access code"""
    data = request.json
    access_code = data.get('access_code')
    
    if not access_code:
        return jsonify({'error': 'Access code is required'}), 400
    
    try:
        user = user_manager.login_with_access_code(access_code)
        
        if not user:
            return jsonify({'error': 'Invalid access code'}), 401
        
        # Create a session
        session = user_manager.create_session(user['id'])
        
        # Return session information
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user['id'],
                'display_name': user['display_name'],
                'public_key': user['public_key']
            },
            'token': session['token']
        })
    except Exception as e:
        app.logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/users/online', methods=['GET'])
def get_online_users():
    """Get a list of online users"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    payload = user_manager.validate_token(token)
    
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    # Get online users
    current_user_id = payload['user_id']
    online_users = user_manager.get_online_users()
    
    # Filter out the requestor
    online_users = [
        user for user in online_users if user['id'] != current_user_id
    ]
    
    return jsonify({'users': online_users})

@app.route('/api/users/<user_id>/public-key', methods=['GET'])
def get_public_key(user_id):
    """Get a user's public key"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    payload = user_manager.validate_token(token)
    
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    public_key = user_manager.get_public_key(user_id)
    
    if not public_key:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'public_key': public_key})

@app.route('/api/users/profile', methods=['PUT'])
def update_profile():
    """Update user profile (currently just display name)"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    payload = user_manager.validate_token(token)
    
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    data = request.json
    display_name = data.get('display_name')
    
    if not display_name:
        return jsonify({'error': 'Display name is required'}), 400
    
    success = user_manager.update_display_name(payload['user_id'], display_name)
    
    if not success:
        return jsonify({'error': 'Failed to update profile'}), 500
    
    return jsonify({'message': 'Profile updated successfully'})
@app.route('/api/users/profile', methods=['GET'])
def get_user_profile():
    # Get the token from the request
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    payload = user_manager.validate_token(token)
    
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    # Get the user info from the token
    user_id = payload.get('user_id')
    user = user_manager.get_user_by_id(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Return user profile data
    return jsonify({
        'user': {
            'id': user['id'],
            'display_name': user.get('display_name', 'Anonymous'),
        }
    })


@app.route('/api/messages', methods=['POST'])

def store_message():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    payload = user_manager.validate_token(token)
    
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    data = request.json
    recipient_id = data.get('recipient_id')
    encrypted_content = data.get('encrypted_content')
    encrypted_key = data.get('encrypted_key')
    signature = data.get('signature')
    
    if not all([recipient_id, encrypted_content, encrypted_key, signature]):
        return jsonify({'error': 'Missing required message fields'}), 400
    
    db = get_db()
    try:
        # Convert dictionary to JSON string before storing
        encrypted_content_json = json.dumps(encrypted_content)
      
        # Create message
        message = Message(
            id=str(uuid.uuid4()),
            sender_id=payload['user_id'],
            recipient_id=recipient_id,
            encrypted_content=encrypted_content_json,  # Now it's a JSON string
            encrypted_key=encrypted_key,
            signature=signature
        )
        
        db.add(message)
        db.commit()
        
        return jsonify({'message': 'Message stored successfully', 'id': message.id})
    except Exception as e:
        db.rollback()
        app.logger.error(f"Error storing message: {str(e)}")
        return jsonify({'error': 'Failed to store message'}), 500
    finally:
        db.close()

@app.route('/api/messages', methods=['GET'])
def get_messages():
    """Get messages for the authenticated user"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    payload = user_manager.validate_token(token)
    
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    user_id = payload['user_id']
    other_user_id = request.args.get('user_id')
    
    if not other_user_id:
        return jsonify({'error': 'Other user ID is required'}), 400
    
    # Get messages between the two users
    db = get_db()
    try:
        # Query messages in both directions
        messages = db.query(Message).filter(
            ((Message.sender_id == user_id) & (Message.recipient_id == other_user_id)) | 
            ((Message.sender_id == other_user_id) & (Message.recipient_id == user_id))
        ).order_by(Message.created_at).all()
        
        # Format messages
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({
                'id': msg.id,
                'sender_id': msg.sender_id,
                'recipient_id': msg.recipient_id,
                'encrypted_content': msg.encrypted_content,
                'encrypted_key': msg.encrypted_key,
                'signature': msg.signature,
                'timestamp': msg.created_at.isoformat()
            })
        
        return jsonify({'messages': formatted_messages})
    except Exception as e:
        app.logger.error(f"Error fetching messages: {str(e)}")
        return jsonify({'error': 'Failed to fetch messages'}), 500
    finally:
        db.close()

# WebSocket event handlers
@socketio.on('connect')
def on_connect():
    """Handle new socket connection"""
    token = request.args.get('token')
    
    if not token:
        return False  # Reject connection
    
    payload = user_manager.validate_token(token)
    
    if not payload:
        return False  # Reject connection
    
    # Store session for this socket
    user_id = payload['user_id']
    user = user_manager.get_user(user_id)
    
    # Create a new session or get existing one
    session = user_manager.create_session(user_id)
    socket_sessions[request.sid] = session['session_id']
    
    # Notify other users that this user is online
    emit('user_online', {
        'user': {
            'id': user['id'],
            'display_name': user['display_name']
        }
    }, broadcast=True, include_self=False)
    
    return True
# Add a new handler to verify rooms:
@socketio.on('verify_room')
@authenticated_only
def verify_room(data):
    """Verify that a room exists and users are in it"""
    room = data.get('room')
    user_ids = data.get('user_ids', [])
    
    if not room:
        emit('error', {'message': 'Room name is required'})
        return
    
    user = get_user_from_socket(request.sid)
    
    # Make sure this user is in the room
    join_room(room)
    
    # Print debug info
    print(f"Verifying room: {room} for users: {user_ids}")
    
    # Emit to all users in the room to confirm membership
    emit('room_verified', {
        'room': room,
        'user_ids': user_ids,
        'verified_by': user['id']
    }, room=room)
    
    # Return confirmation to the caller
    emit('room_verification_result', {
        'room': room,
        'success': True
    })

@socketio.on('disconnect')
def on_disconnect():
    """Handle socket disconnection"""
    if request.sid in socket_sessions:
        session_id = socket_sessions[request.sid]
        user = user_manager.get_user_for_session(session_id)
        
        # End the session
        user_manager.end_session(session_id)
        del socket_sessions[request.sid]
        
        # Notify other users that this user is offline
        if user:
            emit('user_offline', {
                'user': {
                    'id': user['id'],
                    'display_name': user['display_name']
                }
            }, broadcast=True)


# Modify the on_join handler in app.py:
@socketio.on('join')
@authenticated_only
def on_join(data):
    """Join a chat room with another user"""
    room = data.get('room')
    target_user_id = data.get('user_id')
    
    if not room and target_user_id:
        # If room is not specified but user_id is, create the standard room name
        user = get_user_from_socket(request.sid)
        if user:
            room = "_".join(sorted([user['id'], target_user_id]))
        else:
            emit('error', {'message': 'Authentication required to join room'})
            return
    
    if not room:
        emit('error', {'message': 'Room name or target user ID is required'})
        return
    
    print(f"User joining room: {room}")
    join_room(room)
    
    emit('joined', {'room': room, 'with': target_user_id})


@socketio.on('leave')
@authenticated_only
def on_leave(data):
    """Leave a chat room"""
    room = data.get('room')
    
    if not room:
        emit('error', {'message': 'Room name is required'})
        return
    
    leave_room(room)
    emit('left', {'room': room})
# Enhance the on_message handler with better room broadcasting:
@socketio.on('message')
@authenticated_only
def on_message(data):
    """Handle a new message"""
    room = data.get('room')
    secure_message = data.get('secure_message')
    
    if not room or not secure_message:
        emit('error', {'message': 'Room and secure message are required'})
        return
    
    user = get_user_from_socket(request.sid)
    if not user:
        emit('error', {'message': 'Authentication required'})
        return
    
    # Parse the secure message
    recipient_id = secure_message.get('recipient_id')
    encrypted_content = secure_message.get('encrypted_content')
    encrypted_key = secure_message.get('encrypted_key')
    signature = secure_message.get('signature')
    
    if not all([recipient_id, encrypted_content, encrypted_key, signature]):
        emit('error', {'message': 'Invalid secure message format'})
        return
    
    # Generate a unique message ID if not provided
    message_id = data.get('id') or str(uuid.uuid4())
    
    # Store the message in the database
    db = get_db()
    try:
        encrypted_content_json = json.dumps(encrypted_content)
    
        message = Message(
            id=message_id,
            sender_id=user['id'],
            recipient_id=recipient_id,
            encrypted_content=encrypted_content_json,
            encrypted_key=encrypted_key,
            signature=signature,
        )
        
        db.add(message)
        db.commit()
        
        # Add sender info for the recipient
        message_data = {
            'id': message.id,
            'sender': {
                'id': user['id'],
                'display_name': user['display_name']
            },
            'secure_message': secure_message,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # CRITICAL: Debug info
        print(f"Broadcasting message to room: {room}")
        print(f"Message sender: {user['id']}, recipient: {recipient_id}")
        print(f"Current SID: {request.sid}")
        
        # CRITICAL: Use broadcast=True to ensure all users in the room receive it
        emit('message', message_data, room=room, broadcast=True, include_self=False)
        
        # CRITICAL: Emit success back to sender
        emit('message_sent', {'id': message.id, 'room': room, 'success': True})
        
        print(f"Message broadcast completed for ID: {message.id}")
        
    except Exception as e:
        db.rollback()
        print(f"Error in message handling: {str(e)}")
        emit('error', {'message': f'Failed to store message: {str(e)}'})
    finally:
        db.close()
@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin')
    allowed_origins = ["https://zecret.vercel.app", "http://localhost:3000","https://zecret-qxavsbcl0-cashnfts-projects.vercel.app/"]
    if origin in allowed_origins:
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response


if __name__ == '__main__':
    # For development
    port = int(os.getenv('PORT', 5000))
    socketio.run(app, debug=True, host='0.0.0.0', port=port)