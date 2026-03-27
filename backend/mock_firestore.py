import os
import json
from datetime import datetime

class MockDocumentSnapshot:
    def __init__(self, data, doc_id):
        self._data = data
        self.id = doc_id
        self.exists = data is not None

    def to_dict(self):
        return self._data if self._data else {}

class MockDocumentReference:
    def __init__(self, db, collection_name, doc_id):
        self.db = db
        self.collection_name = collection_name
        self.id = doc_id

    def get(self):
        doc = self.db._get_doc(self.collection_name, self.id)
        return MockDocumentSnapshot(doc, self.id)

    def set(self, data):
        self.db._set_doc(self.collection_name, self.id, data)

    def update(self, data):
        self.db._update_doc(self.collection_name, self.id, data)

class MockQuery:
    def __init__(self, db, collection_name):
        self.db = db
        self.collection_name = collection_name
        self._filters = []
        self._limit = None
        self._order_by = None
        
        # We need this to handle the class import in queries like `firestore.Query.DESCENDING`
        self.DESCENDING = "DESCENDING"
        self.ASCENDING = "ASCENDING"

    def where(self, field, op, value):
        q = MockQuery(self.db, self.collection_name)
        q._filters = list(self._filters)
        q._filters.append((field, op, value))
        q._limit = self._limit
        q._order_by = self._order_by
        return q

    def limit(self, count):
        q = MockQuery(self.db, self.collection_name)
        q._filters = list(self._filters)
        q._limit = count
        q._order_by = self._order_by
        return q

    def order_by(self, field, direction="ASCENDING"):
        q = MockQuery(self.db, self.collection_name)
        q._filters = list(self._filters)
        q._limit = self._limit
        q._order_by = (field, direction)
        return q

    def get(self):
        docs = self.db._get_collection(self.collection_name)
        
        results = []
        for doc_id, doc_data in docs.items():
            match = True
            for field, op, value in self._filters:
                doc_val = doc_data.get(field)
                if op == '==':
                    if doc_val != value: match = False
                elif op == '>':
                    if doc_val is None or doc_val <= value: match = False
                elif op == '<':
                    if doc_val is None or doc_val >= value: match = False
            if match:
                results.append(MockDocumentSnapshot(doc_data, doc_id))
        
        if self._order_by:
            field, direction = self._order_by
            results.sort(
                key=lambda x: x._data.get(field) if x._data.get(field) is not None else "",
                reverse=(direction == "DESCENDING" or direction == getattr(self, "DESCENDING", "DESCENDING"))
            )
            
        if self._limit is not None:
            results = results[:self._limit]
            
        return results

    # Support iteration directly on Query for things like "for doc in all_txns:"
    def __iter__(self):
        return iter(self.get())

class MockCollectionReference(MockQuery):
    def __init__(self, db, collection_name):
        super().__init__(db, collection_name)

    def document(self, doc_id=None):
        if doc_id is None:
            import uuid
            doc_id = str(uuid.uuid4())
        return MockDocumentReference(self.db, self.collection_name, doc_id)

class MockFirestore:
    def __init__(self, db_file="mock_db.json"):
        self.db_file = os.path.join(os.path.dirname(__file__), db_file)
        self._data = self._load()
        # Mock class variables/constants needed by standard firestore
        class DummyQuery:
            DESCENDING = "DESCENDING"
            ASCENDING = "ASCENDING"
        self.Query = DummyQuery()

    def _load(self):
        if os.path.exists(self.db_file):
            with open(self.db_file, 'r') as f:
                return json.load(f)
        return {}

    def _save(self):
        with open(self.db_file, 'w') as f:
            json.dump(self._data, f, indent=2)

    def collection(self, collection_name):
        return MockCollectionReference(self, collection_name)

    def _get_collection(self, coll):
        return self._data.get(coll, {})

    def _get_doc(self, coll, doc_id):
        return self._data.get(coll, {}).get(doc_id)

    def _set_doc(self, coll, doc_id, data):
        if coll not in self._data:
            self._data[coll] = {}
        self._data[coll][doc_id] = data
        self._save()

    def _update_doc(self, coll, doc_id, data):
        if coll not in self._data or doc_id not in self._data[coll]:
            raise Exception("Document not found")
        self._data[coll][doc_id].update(data)
        self._save()

_singleton_db = None

def get_db():
    global _singleton_db
    if _singleton_db is None:
        _singleton_db = MockFirestore()
    return _singleton_db
