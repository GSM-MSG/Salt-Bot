import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { firestore } from "../firebase";

interface Salt {
  userId: string;
  username: string;
  count: number;
}

export interface SaltRepository {
  getReceivedSaltRankList(): Promise<Salt[]>;
  getReceivedSalt(userId: string): Promise<Salt>;
  getUsedSalt(userId: string): Promise<number>;
  getBuriedSalt(userId: string): Promise<number>;
  updateBuriedSalt(userId: string, count: number): Promise<void>;
  updateUsedSalt(userId: string, saltCount: number): Promise<void>;
  updateReceivedSalt(userId: string, username: string, saltCount: number): Promise<void>;
}

class FirebaseSaltRepository implements SaltRepository {
  receivedSaltKey = "ReceivedSalt";
  usedSaltKey = "UsedSalt";
  BuriedSaltKey = "BuriedSalt";

  async getReceivedSaltRankList(): Promise<Salt[]> {
    const snapshot = await getDocs(collection(firestore, this.receivedSaltKey));
    const saltList: Salt[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        userId: data.userId,
        username: data.username,
        count: data.saltCount
      };
    });
    return saltList;
  }

  async getReceivedSalt(userId: string): Promise<Salt> {
    const docRef = doc(firestore, this.receivedSaltKey, userId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists())
      return {
        userId: userId,
        username: "",
        count: 0
      };
    const data = snapshot.data();
    return {
      userId: data.userId,
      username: data.username,
      count: data.saltCount
    };
  }

  async getUsedSalt(userId: string): Promise<number> {
    const docRef = doc(firestore, this.usedSaltKey, userId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return 0;
    const data = snapshot.data();
    return data.count;
  }

  async getBuriedSalt(userId: string): Promise<number> {
      const docRef = doc(firestore, this.BuriedSaltKey, userId);
      const snapshot = await getDoc(docRef);
      if(!snapshot.exists()) return 0;
      const data = snapshot.data();
      return data.count;
  }

  async updateBuriedSalt(userId: string, count: number): Promise<void> {
    await setDoc(doc(firestore, this.BuriedSaltKey, userId), {
      count: count
    })
    return;
  }

  async updateUsedSalt(userId: string, saltCount: number): Promise<void> {
    await setDoc(doc(firestore, this.usedSaltKey, userId), {
      count: saltCount
    });
    return;
  }

  async updateReceivedSalt(userId: string, username: string, saltCount: number): Promise<void> {
    await setDoc(doc(firestore, this.receivedSaltKey, userId), {
      userId: userId,
      username: username,
      saltCount: saltCount
    });
    return;
  }
}

export const saltRepository: SaltRepository = new FirebaseSaltRepository();
