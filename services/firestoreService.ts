import { db } from '../firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
} from 'firebase/firestore';
import { RoscaCycle, AppUser } from '../types';

const CYCLES_COLLECTION = 'cycles';
const USERS_COLLECTION = 'users';

// Real-time Listeners
export const onCyclesUpdate = (callback: (cycles: RoscaCycle[]) => void) => {
  const q = query(collection(db, CYCLES_COLLECTION));
  return onSnapshot(q, (querySnapshot) => {
    const cycles = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Manually reconstruct the object to ensure it's plain and serializable.
      // This prevents circular reference errors when state derived from this data
      // is used with JSON.stringify or sent back to Firestore.
      const plainData = {
          ...data,
          id: doc.id,
          // Deep copy nested arrays of objects to ensure they are plain.
          members: data.members ? data.members.map((m: any) => ({...m})) : [],
          months: data.months ? data.months.map((month: any) => ({
              ...month,
              contributions: month.contributions ? month.contributions.map((c: any) => ({...c})) : []
          })) : [],
      };
      return plainData as RoscaCycle;
    });
    callback(cycles);
  }, (error) => {
    console.error("Error listening to cycles collection:", error);
  });
};

export const onUsersUpdate = (callback: (users: AppUser[]) => void) => {
  const q = query(collection(db, USERS_COLLECTION));
  return onSnapshot(q, (querySnapshot) => {
    // Spreading the user data is sufficient as the AppUser object is flat.
    const users = querySnapshot.docs.map(doc => ({ ...(doc.data() as AppUser) }));
    callback(users);
  }, (error) => {
    console.error("Error listening to users collection:", error);
  });
};

// Cycle Management
export const updateCycle = async (cycleId: string, updatedCycleData: RoscaCycle) => {
    const cycleRef = doc(db, CYCLES_COLLECTION, cycleId);
    // Firestore doesn't like the 'id' field in the data object itself, so we remove it before saving
    const { id, ...dataToSave } = updatedCycleData; 
    await setDoc(cycleRef, dataToSave);
};

// User Management
export const addUser = async (userData: AppUser) => {
    // Use uid as the document ID for easy lookup
    await setDoc(doc(db, USERS_COLLECTION, userData.uid), userData);
};

export const deleteUser = async (uid: string) => {
    await deleteDoc(doc(db, USERS_COLLECTION, uid));
};


// Batch operations for ensuring data consistency
export const createCycleAndUpdateUsers = async (cycleData: Omit<RoscaCycle, 'id'>, userIds: string[]) => {
    const batch = writeBatch(db);
    
    // 1. Create a new document reference for the cycle to get its ID
    const newCycleRef = doc(collection(db, CYCLES_COLLECTION));
    batch.set(newCycleRef, cycleData);

    // 2. Update all selected users to assign them to the new cycle
    userIds.forEach(uid => {
        const userRef = doc(db, USERS_COLLECTION, uid);
        batch.update(userRef, { cycleId: newCycleRef.id });
    });

    await batch.commit();
    return newCycleRef.id;
};

export const deleteCycleAndUnassignUsers = async (cycleId: string, userIds: string[]) => {
    const batch = writeBatch(db);

    // 1. Delete the cycle document
    const cycleRef = doc(db, CYCLES_COLLECTION, cycleId);
    batch.delete(cycleRef);

    // 2. Unassign all users from the deleted cycle
    userIds.forEach(uid => {
        const userRef = doc(db, USERS_COLLECTION, uid);
        batch.update(userRef, { cycleId: undefined });
    });

    await batch.commit();
};

export const removeMemberFromCycleAndUpdateUser = async (cycleId: string, updatedCycle: RoscaCycle, memberIdToRemove: string) => {
    const batch = writeBatch(db);

    // 1. Update the cycle with the member removed
    const cycleRef = doc(db, CYCLES_COLLECTION, cycleId);
    const { id, ...dataToSave } = updatedCycle;
    batch.set(cycleRef, dataToSave);
    
    // 2. Unassign the user from the cycle
    const userRef = doc(db, USERS_COLLECTION, memberIdToRemove);
    batch.update(userRef, { cycleId: undefined });

    await batch.commit();
};

export const addMembersToCycleAndUpdateUsers = async (cycleId: string, updatedCycle: RoscaCycle, newUserIds: string[]) => {
    const batch = writeBatch(db);
    
    // 1. Update the cycle with the new members
    const cycleRef = doc(db, CYCLES_COLLECTION, cycleId);
    const { id, ...dataToSave } = updatedCycle;
    batch.set(cycleRef, dataToSave);

    // 2. Assign the new users to this cycle
    newUserIds.forEach(uid => {
        const userRef = doc(db, USERS_COLLECTION, uid);
        batch.update(userRef, { cycleId: cycleId });
    });

    await batch.commit();
};

export const updateUserAndCycles = async (uid: string, updatedUserData: Partial<AppUser>, cyclesToUpdate: RoscaCycle[]) => {
    const batch = writeBatch(db);

    // 1. Update the user document
    const userRef = doc(db, USERS_COLLECTION, uid);
    batch.update(userRef, updatedUserData);

    // 2. Update the member details in each cycle the user belongs to
    cyclesToUpdate.forEach(cycle => {
        const updatedMembers = cycle.members.map(member => 
            member.id === uid ? { ...member, ...updatedUserData } : member
        );
        const cycleRef = doc(db, CYCLES_COLLECTION, cycle.id);
        batch.update(cycleRef, { members: updatedMembers });
    });

    await batch.commit();
};
