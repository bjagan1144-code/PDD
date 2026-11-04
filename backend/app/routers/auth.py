import os
import time
import datetime
import requests
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from firebase_admin import auth as firebase_auth

from app.database import db, MockFirestoreClient
from app.schemas.api_schemas import UserRegister, UserLogin, UserResponse, Token
from app.services.auth_service import hash_password, verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# High-concurrency in-memory user profile and login cache
_USER_CACHE = {}
_USER_CACHE_TTL = 300.0
_LOGIN_CACHE = {}
_LOGIN_CACHE_TTL = 300.0

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """ Resolves the current authenticated user from the Bearer Firebase ID Token (or local JWT in mock mode) """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
        
    try:
        if isinstance(db, MockFirestoreClient):
            # Fallback to local JWT decoding for offline demo testing
            payload = decode_access_token(token)
            if payload is None:
                raise credentials_exception
            email = payload.get("sub")
            uid = payload.get("uid", f"mock-uid-{email.split('@')[0]}")
            name = payload.get("name", email.split("@")[0])
            role = payload.get("role", "Researcher")
        else:
            # Verify Firebase ID token
            decoded_token = firebase_auth.verify_id_token(token)
            uid = decoded_token['uid']
            email = decoded_token['email']
            name = decoded_token.get("name", email.split("@")[0])
            role = "Researcher"
    except Exception as e:
        print(f"Token verification failed: {e}. Trying local fallback.")
        try:
            payload = decode_access_token(token)
            if payload:
                email = payload.get("sub")
                uid = payload.get("uid", f"mock-uid-{email.split('@')[0]}")
                name = payload.get("name", email.split("@")[0])
                role = payload.get("role", "Researcher")
            else:
                raise credentials_exception
        except Exception:
            raise credentials_exception

    now = time.time()
    if uid in _USER_CACHE:
        cached_prof, cached_at = _USER_CACHE[uid]
        if (now - cached_at) < _USER_CACHE_TTL:
            return cached_prof
        
    # Get user profile from Firestore users/{uid} collection
    user_doc = db.collection("users").document(uid).get()
    if not user_doc.exists:
        # Auto-provision profile details if registered via client-side Auth directly
        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        user_profile = {
            "id": uid,
            "name": name,
            "email": email,
            "role": role,
            "created_at": now_str
        }
        db.collection("users").document(uid).set(user_profile)
        _USER_CACHE[uid] = (user_profile, now)
        return user_profile
        
    user_profile = user_doc.to_dict()
    _USER_CACHE[uid] = (user_profile, now)
    return user_profile

@router.post("/register", response_model=UserResponse)
def register(user_data: UserRegister):
    """ Registers a new researcher using Firebase Authentication (or local mock in mock mode) and Firestore profiles """
    uid = None
    if isinstance(db, MockFirestoreClient):
        # Local mock registration fallback
        uid = f"mock-uid-{user_data.email.split('@')[0]}"
        # Check if user already exists
        existing_doc = db.collection("users").document(uid).get()
        if existing_doc.exists:
            raise HTTPException(status_code=400, detail="Email is already registered")
    else:
        try:
            # Create user in Firebase Auth
            user_record = firebase_auth.create_user(
                email=user_data.email,
                password=user_data.password,
                display_name=user_data.name
            )
            uid = user_record.uid
        except Exception as e:
            detail_msg = str(e)
            if "already exists" in detail_msg.lower() or "already registered" in detail_msg.lower():
                raise HTTPException(status_code=400, detail="Email is already registered")
            raise HTTPException(status_code=400, detail=f"Registration failed: {detail_msg}")
    
    # Save user profile metadata to Firestore with securely hashed password
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    user_profile = {
        "id": uid,
        "name": user_data.name,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "role": user_data.role,
        "created_at": now_str
    }
    
    try:
        db.collection("users").document(uid).set(user_profile)
    except Exception as e:
        # Rollback auth creation if Firestore write fails
        if not isinstance(db, MockFirestoreClient):
            try:
                firebase_auth.delete_user(uid)
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"Failed to create user profile database record: {e}")
        
    return user_profile

@router.post("/login", response_model=Token)
def login(login_data: UserLogin):
    """ Authenticates user credentials via Firebase Auth REST API (or local mock in mock mode) and issues an access token """
    now = time.time()
    cache_key = (login_data.email, login_data.password)
    if cache_key in _LOGIN_CACHE:
        cached_token, cached_at = _LOGIN_CACHE[cache_key]
        if (now - cached_at) < _LOGIN_CACHE_TTL:
            return cached_token

    if isinstance(db, MockFirestoreClient):
        # Local mock JWT login fallback for offline/localhost runs without API credentials
        # Look up profile by uid or email
        uid = f"mock-uid-{login_data.email.split('@')[0]}"
        user_doc = db.collection("users").document(uid).get()
        
        user_data = None
        if user_doc.exists:
            user_data = user_doc.to_dict()
        else:
            # Query by email in case uid format differs
            matched_users = db.collection("users").where("email", "==", login_data.email).get()
            if matched_users:
                user_data = matched_users[0].to_dict()
                uid = user_data.get("id", uid)

        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        # Strictly validate password against stored user record (supporting bcrypt and legacy plain)
        stored_password = user_data.get("password")
        if not stored_password:
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        password_valid = verify_password(login_data.password, stored_password)
        if not password_valid and stored_password == login_data.password:
            # Upgrade legacy plaintext password to bcrypt hash
            password_valid = True
            try:
                user_data["password"] = hash_password(login_data.password)
                db.collection("users").document(uid).set(user_data)
            except Exception:
                pass

        if not password_valid:
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        role = user_data.get("role", "Researcher")
        name = user_data.get("name", login_data.email.split("@")[0])
            
        access_token = create_access_token(data={
            "sub": login_data.email, 
            "uid": uid, 
            "role": role,
            "name": name
        })
        token_resp = {"access_token": access_token, "token_type": "bearer"}
        _LOGIN_CACHE[cache_key] = (token_resp, now)
        return token_resp

    # Firebase Live Auth
    web_api_key = os.getenv("FIREBASE_WEB_API_KEY")
    if web_api_key:
        rest_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={web_api_key}"
        payload = {
            "email": login_data.email,
            "password": login_data.password,
            "returnSecureToken": True
        }
        
        try:
            res = requests.post(rest_url, json=payload, timeout=5)
            if res.status_code == 200:
                id_token = res.json().get("idToken")
                return {"access_token": id_token, "token_type": "bearer"}
        except requests.RequestException:
            pass

    # Fallback to Firestore users collection verification (for migrated/pre-existing accounts)
    uid = f"mock-uid-{login_data.email.split('@')[0]}"
    user_doc = db.collection("users").document(uid).get()
    
    user_data = None
    if user_doc.exists:
        user_data = user_doc.to_dict()
    else:
        matched_users = list(db.collection("users").where("email", "==", login_data.email).limit(1).get())
        if matched_users:
            user_data = matched_users[0].to_dict()
            uid = user_data.get("id", uid)

    if user_data:
        stored_password = user_data.get("password")
        if stored_password:
            password_valid = verify_password(login_data.password, stored_password)
            if not password_valid and stored_password == login_data.password:
                password_valid = True
                try:
                    user_data["password"] = hash_password(login_data.password)
                    db.collection("users").document(uid).set(user_data)
                except Exception:
                    pass

            if password_valid:
                role = user_data.get("role", "Researcher")
                name = user_data.get("name", login_data.email.split("@")[0])

                # Synchronize to Firebase Auth so Identity Toolkit recognizes this researcher
                try:
                    firebase_auth.create_user(
                        uid=uid,
                        email=login_data.email,
                        password=login_data.password,
                        display_name=name
                    )
                except Exception:
                    pass

                access_token = create_access_token(data={
                    "sub": login_data.email,
                    "uid": uid,
                    "role": role,
                    "name": name
                })
                return {"access_token": access_token, "token_type": "bearer"}

    raise HTTPException(status_code=401, detail="Invalid email or password")

@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    """ Returns the authenticated user's profile metadata """
    return current_user

@router.post("/logout")
def logout():
    """ Client handles token deletion; returns success status """
    return {"message": "Logged out successfully"}
