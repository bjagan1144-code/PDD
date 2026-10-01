import os
import datetime
import requests
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from firebase_admin import auth as firebase_auth

from app.database import db, MockFirestoreClient
from app.schemas.api_schemas import UserRegister, UserLogin, UserResponse, Token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

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
            from app.services.auth_service import decode_access_token
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
            from app.services.auth_service import decode_access_token
            payload = decode_access_token(token)
            if payload:
                email = payload.get("sub")
                uid = payload.get("uid", f"mock-uid-{email.split('@')[0]}")
                name = payload.get("name", email.split("@")[0])
                role = payload.get("role", "Researcher")
            else:
                raise credentials_exception
        except:
            raise credentials_exception
        
    # Get user profile from Firestore users/{uid} collection
    user_doc = db.collection("users").document(uid).get()
    if not user_doc.exists:
        # Auto-provision profile details if registered via client-side Auth directly
        user_profile = {
            "id": uid,
            "name": name,
            "email": email,
            "role": role,
            "created_at": datetime.datetime.utcnow().isoformat()
        }
        db.collection("users").document(uid).set(user_profile)
        return user_profile
        
    return user_doc.to_dict()

@router.post("/register", response_model=UserResponse)
def register(user_data: UserRegister):
    """ Registers a new researcher using Firebase Authentication (or local mock in mock mode) and Firestore profiles """
    uid = None
    if isinstance(db, MockFirestoreClient):
        # Local mock registration fallback
        uid = f"mock-uid-{user_data.email.split('@')[0]}"
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
    
    # Save user profile metadata to Firestore
    user_profile = {
        "id": uid,
        "name": user_data.name,
        "email": user_data.email,
        "role": user_data.role,
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    
    try:
        db.collection("users").document(uid).set(user_profile)
    except Exception as e:
        # Rollback auth creation if Firestore write fails
        if not isinstance(db, MockFirestoreClient):
            try:
                firebase_auth.delete_user(uid)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Failed to create user profile database record: {e}")
        
    return user_profile

@router.post("/login", response_model=Token)
def login(login_data: UserLogin):
    """ Authenticates user credentials via Firebase Auth REST API (or local mock in mock mode) and issues an access token """
    if isinstance(db, MockFirestoreClient):
        # Local mock JWT login fallback for offline/localhost runs without API credentials
        from app.services.auth_service import create_access_token
        # Look up profile role if exists
        uid = f"mock-uid-{login_data.email.split('@')[0]}"
        user_doc = db.collection("users").document(uid).get()
        role = "Researcher"
        if user_doc.exists:
            role = user_doc.to_dict().get("role", "Researcher")
            
        access_token = create_access_token(data={
            "sub": login_data.email, 
            "uid": uid, 
            "role": role,
            "name": login_data.email.split("@")[0]
        })
        return {"access_token": access_token, "token_type": "bearer"}

    # Firebase Live Auth
    web_api_key = os.getenv("FIREBASE_WEB_API_KEY")
    if not web_api_key:
        raise HTTPException(
            status_code=500,
            detail="Server configuration error: FIREBASE_WEB_API_KEY environment variable is not set."
        )
        
    rest_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={web_api_key}"
    payload = {
        "email": login_data.email,
        "password": login_data.password,
        "returnSecureToken": True
    }
    
    try:
        res = requests.post(rest_url, json=payload, timeout=5)
        res_data = res.json()
        if res.status_code != 200:
            error_msg = res_data.get("error", {}).get("message", "Invalid email or password")
            if "invalid_password" in error_msg.lower() or "email_not_found" in error_msg.lower():
                raise HTTPException(status_code=401, detail="Invalid email or password")
            raise HTTPException(status_code=res.status_code, detail=f"Authentication failed: {error_msg}")
            
        id_token = res_data["idToken"]
        return {"access_token": id_token, "token_type": "bearer"}
    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Firebase Authentication gateway connection error: {e}")

@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    """ Returns the authenticated user's profile metadata """
    return current_user

@router.post("/logout")
def logout():
    """ Client handles token deletion; returns success status """
    return {"message": "Logged out successfully"}
