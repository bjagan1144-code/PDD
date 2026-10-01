import os
import json
import uuid
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# Locate and load the root env configuration
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env'))

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

class MockFirestoreStore:
    def __init__(self, filename="mock_firestore.json"):
        # Put mock database file inside backend workspace
        self.filename = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", filename)
        self.data = {}
        self.load()

    def load(self):
        if os.path.exists(self.filename):
            try:
                with open(self.filename, "r") as f:
                    self.data = json.load(f)
            except:
                self.data = {}
        else:
            self.data = {}

    def save(self):
        try:
            with open(self.filename, "w") as f:
                json.dump(self.data, f, indent=2)
        except Exception as e:
            print(f"Error saving mock firestore data: {e}")

    def get_collection(self, collection_name):
        return self.data.setdefault(collection_name, {})

    def get_doc(self, collection_name, doc_id):
        coll = self.get_collection(collection_name)
        return coll.get(doc_id)

    def set_doc(self, collection_name, doc_id, data):
        coll = self.get_collection(collection_name)
        cleaned_data = {}
        for k, v in data.items():
            if hasattr(v, "isoformat"):
                cleaned_data[k] = v.isoformat()
            else:
                cleaned_data[k] = v
        coll[doc_id] = cleaned_data
        self.save()

    def delete_doc(self, collection_name, doc_id):
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

use_live_firebase = False
has_credentials = firebase_config_dict["private_key"] is not None and firebase_config_dict["client_email"] is not None
has_adc = os.getenv("GOOGLE_APPLICATION_CREDENTIALS") is not None

if has_credentials or has_adc:
    if not firebase_admin._apps:
        try:
            if has_credentials:
                cred = credentials.Certificate(firebase_config_dict)
                firebase_admin.initialize_app(cred)
            else:
                firebase_admin.initialize_app()
            use_live_firebase = True
            print("Firebase Admin SDK successfully initialized.")
        except Exception as e:
            print(f"Warning: Firebase Admin initialization error: {e}. Falling back to MockFirestoreClient.")
            use_live_firebase = False
    else:
        use_live_firebase = True
else:
    print("No Firebase credentials detected. Falling back to local MockFirestoreClient.")

if use_live_firebase:
    db = firestore.client()
else:
    db = MockFirestoreClient()

def get_db():
    """ Dependency yielding the active Cloud Firestore or MockFirestore client """
    yield db
