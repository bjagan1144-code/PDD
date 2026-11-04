import os
import json
import uuid
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# Locate and load the env configuration (search backend/.env first, then root .env)
_backend_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
_root_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env')
if os.path.exists(_backend_env):
    load_dotenv(_backend_env)
elif os.path.exists(_root_env):
    load_dotenv(_root_env)
else:
    load_dotenv()

# --- MOCK FIRESTORE INTERFACE COMPATIBILITY LAYER ---
class MockDocument:
    def __init__(self, doc_id, data):
        self.id = doc_id
        self._data = data
        self.exists = data is not None

    def to_dict(self):
        return self._data

class MockQuery:
    def __init__(self, collection_name, docs, filters=None):
        self.collection_name = collection_name
        self.docs = docs
        self.filters = filters or []

    def where(self, field, operator, value):
        new_filters = self.filters + [(field, operator, value)]
        filtered_docs = {}
        for doc_id, data in self.docs.items():
            if data is None:
                continue
            val = data.get(field)
            match = False
            if operator == "==":
                match = (val == value)
            elif operator == ">":
                match = (val > value)
            elif operator == "<":
                match = (val < value)
            elif operator == ">=":
                match = (val >= value)
            elif operator == "<=":
                match = (val <= value)
            if match:
                filtered_docs[doc_id] = data
        return MockQuery(self.collection_name, filtered_docs, new_filters)

    def limit(self, count):
        limited_docs = {}
        for i, (k, v) in enumerate(self.docs.items()):
            if i >= count:
                break
            limited_docs[k] = v
        return MockQuery(self.collection_name, limited_docs, self.filters)

    def stream(self):
        return [MockDocument(doc_id, data) for doc_id, data in self.docs.items() if data is not None]

    def get(self):
        return self.stream()

class MockDocumentReference:
    def __init__(self, collection_name, doc_id, store):
        self.collection_name = collection_name
        self.id = doc_id
        self.store = store

    def get(self):
        data = self.store.get_doc(self.collection_name, self.id)
        return MockDocument(self.id, data)

    def set(self, data):
        self.store.set_doc(self.collection_name, self.id, data)

    def delete(self):
        self.store.delete_doc(self.collection_name, self.id)

class MockCollectionReference:
    def __init__(self, collection_name, store):
        self.collection_name = collection_name
        self.store = store

    def document(self, doc_id=None):
        if doc_id is None:
            doc_id = f"mock-doc-{uuid.uuid4().hex[:6]}"
        return MockDocumentReference(self.collection_name, doc_id, self.store)

    def limit(self, count):
        docs = self.store.get_collection(self.collection_name)
        return MockQuery(self.collection_name, docs).limit(count)

    def where(self, field, operator, value):
        docs = self.store.get_collection(self.collection_name)
        return MockQuery(self.collection_name, docs).where(field, operator, value)

    def stream(self):
        docs = self.store.get_collection(self.collection_name)
        return MockQuery(self.collection_name, docs).stream()

import threading

class MockFirestoreStore:
    def __init__(self, filename="mock_firestore.json"):
        # Put mock database file inside backend workspace
        self.filename = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", filename)
        self.data = {}
        self._lock = threading.RLock()
        self.load()

    def load(self):
        with self._lock:
            if os.path.exists(self.filename):
                try:
                    with open(self.filename, "r") as f:
                        self.data = json.load(f)
                except:
                    self.data = {}
            else:
                self.data = {}

    def save(self):
        with self._lock:
            try:
                with open(self.filename, "w") as f:
                    json.dump(self.data, f, indent=2)
            except Exception as e:
                print(f"Error saving mock firestore data: {e}")

    def get_collection(self, collection_name):
        with self._lock:
            return self.data.setdefault(collection_name, {})

    def get_doc(self, collection_name, doc_id):
        with self._lock:
            coll = self.get_collection(collection_name)
            return coll.get(doc_id)

    def set_doc(self, collection_name, doc_id, data):
        with self._lock:
            coll = self.get_collection(collection_name)
            cleaned_data = {}
            for k, v in data.items():
                if hasattr(v, "isoformat"):
                    cleaned_data[k] = v.isoformat()
                else:
                    cleaned_data[k] = v
            coll[doc_id] = cleaned_data
            # Fast in-memory mode under high concurrency skips heavy synchronous disk serializations
            if os.getenv("DISABLE_MOCK_DISK_PERSISTENCE", "").lower() not in ("true", "1"):
                self.save()

    def delete_doc(self, collection_name, doc_id):
        with self._lock:
            coll = self.get_collection(collection_name)
            if doc_id in coll:
                del coll[doc_id]
                self.save()

class MockFirestoreClient:
    def __init__(self):
        self.store = MockFirestoreStore()

    def collection(self, collection_name):
        return MockCollectionReference(collection_name, self.store)

# --- INITIALIZATION LOGIC ---
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 1. Check for service account JSON file
service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH")
if service_account_path and not os.path.isabs(service_account_path):
    service_account_path = os.path.normpath(os.path.join(backend_dir, service_account_path))

if not service_account_path or not os.path.exists(service_account_path):
    default_sa = os.path.normpath(os.path.join(backend_dir, "secrets", "firebase-service-account.json"))
    if os.path.exists(default_sa):
        service_account_path = default_sa

# 2. Check for inline environment variables
private_key = os.getenv("FIREBASE_PRIVATE_KEY")
if private_key:
    private_key = private_key.replace("\\n", "\n")

firebase_config_dict = {
    "type": "service_account",
    "project_id": os.getenv("FIREBASE_PROJECT_ID", "biopatch-ai-fire"),
    "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
    "private_key": private_key,
    "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
    "client_id": os.getenv("FIREBASE_CLIENT_ID"),
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_X509_CERT_URL")
}

has_service_account_file = service_account_path is not None and os.path.exists(service_account_path)
has_credentials_dict = firebase_config_dict["private_key"] is not None and firebase_config_dict["client_email"] is not None
has_adc = os.getenv("GOOGLE_APPLICATION_CREDENTIALS") is not None

force_local = os.getenv("USE_LOCAL_STORAGE", "").lower() in ("true", "1") or os.getenv("STAGING_ENV", "").lower() in ("true", "1")
use_live_firebase = False

if not force_local and (has_service_account_file or has_credentials_dict or has_adc):
    try:
        if not firebase_admin._apps:
            if has_service_account_file:
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred)
            elif has_credentials_dict:
                cred = credentials.Certificate(firebase_config_dict)
                firebase_admin.initialize_app(cred)
            else:
                firebase_admin.initialize_app()
        use_live_firebase = True
        print("Firebase Admin SDK successfully initialized with live credentials.")
    except Exception as e:
        # STRICT REQUIREMENT: Do not silently fall back to mock storage if Firebase connection fails
        raise RuntimeError(
            f"FATAL: Firebase Admin SDK initialization failed: {e}. "
            "Credentials were provided, so silent fallback to mock storage is disabled. "
            "Please check service account key permissions and network connectivity."
        ) from e
else:
    print("No Firebase credentials detected. Falling back to local MockFirestoreClient.")

storage_mode = "live_firestore" if use_live_firebase else "mock_firestore"

if use_live_firebase:
    try:
        db = firestore.client()
        # Verify connection
        _ = db.project
    except Exception as e:
        raise RuntimeError(f"FATAL: Failed to obtain live Firestore client: {e}") from e
else:
    db = MockFirestoreClient()

db.storage_mode = storage_mode

def get_db():
    """ Dependency yielding the active Cloud Firestore or MockFirestore client """
    yield db
