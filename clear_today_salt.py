import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("./msg-salty-firebase-adminsdk.json")
app = firebase_admin.initialize_app(cred)
db = firestore.client(app=app)

def delete_collection(coll_ref, batch_size):
    docs = coll_ref.list_documents(page_size=batch_size)
    deleted = 0

    for doc in docs:
        print(f"Deleting doc {doc.id} => {doc.get().to_dict()}")
        doc.delete()
        deleted = deleted + 1

    if deleted >= batch_size:
        return delete_collection(coll_ref, batch_size)

used_salt_ref = db.collection('UsedSalt')
delete_collection(coll_ref=used_salt_ref, batch_size=10)