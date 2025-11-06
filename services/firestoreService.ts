import { db } from '../firebaseConfig';
// FIX: Remove all v9 modular imports. The db instance from firebaseConfig is now a v8 instance.
import { RoscaCycle, AppUser } from '../types';
import firebase from 'firebase/compat/app';

const CYCLES_COLLECTION = 'cycles';
const USERS_COLLECTION = 'users';

// Real-time Listeners
export const onCyclesUpdate = (callback: (cycles: RoscaCycle[]) => void) => {
  // FIX: Use v8 syntax for collection and onSnapshot.
  const q = db.collection(CYCLES_COLLECTION);
  return q.onSnapshot((querySnapshot) => {
    const cycles = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Manually construct a plain object to prevent circular reference errors.
      // Spreading doc.data() can carry over Firestore-specific properties.
      const plainData: RoscaCycle = {
        id: doc.id,
        name: data.name,
        members: data.members ? data.members.map((m: any) => ({...m})) : [],
        monthlyContributionAmount: data.monthlyContributionAmount,
        currentMonth: data.currentMonth,
        months: data.months ? data.months.map((month: any) => ({
            ...month,
            contributions: month.contributions ? month.contributions.map((c: any) => ({...c})) : []
        })) : [],
        ruleType: data.ruleType,
        joiningFee: data.joiningFee,
        cycleLength: data.cycleLength,
        isArchived: data.isArchived,
        savingsFund: data.savingsFund,
      };
      return plainData;
    });
    callback(cycles);
  }, (error) => {
    console.error("Error listening to cycles collection:", error);
  });
};

export const onUsersUpdate = (callback: (users: AppUser[]) => void) => {
  // FIX: Use v8 syntax for collection and onSnapshot.
  const q = db.collection(USERS_COLLECTION);
  return q.onSnapshot((querySnapshot) => {
    // Spreading the user data is sufficient as the AppUser object is flat.
    const users = querySnapshot.docs.map(doc => ({ ...(doc.data() as AppUser) }));
    callback(users);
  }, (error) => {
    console.error("Error listening to users collection:", error);
  });
};

// Cycle Management
export const updateCycle = async (cycleId: string, updatedCycleData: RoscaCycle) => {
    // FIX: Use v8 syntax for doc and set.
    const cycleRef = db.collection(CYCLES_COLLECTION).doc(cycleId);
    // Firestore doesn't like the 'id' field in the data object itself, so we remove it before saving
    const { id, ...dataToSave } = updatedCycleData; 
    await cycleRef.set(dataToSave);
};

// User Management
export const addUser = async (userData: AppUser) => {
    // FIX: Use v8 syntax for doc and set.
    // Use uid as the document ID for easy lookup
    await db.collection(USERS_COLLECTION).doc(userData.uid).set(userData);
};

export const deleteUser = async (uid: string) => {
    // FIX: Use v8 syntax for doc and delete.
    await db.collection(USERS_COLLECTION).doc(uid).delete();
};


// Batch operations for ensuring data consistency
export const createCycleAndUpdateUsers = async (cycleData: Omit<RoscaCycle, 'id'>, userIds: string[]) => {
    // FIX: Use v8 syntax for batch operations.
    const batch = db.batch();
    
    // 1. Create a new document reference for the cycle to get its ID
    const newCycleRef = db.collection(CYCLES_COLLECTION).doc();
    batch.set(newCycleRef, cycleData);

    // 2. Update all selected users to assign them to the new cycle
    userIds.forEach(uid => {
        const userRef = db.collection(USERS_COLLECTION).doc(uid);
        batch.update(userRef, { cycleId: newCycleRef.id });
    });

    await batch.commit();
    return newCycleRef.id;
};

export const deleteCycleAndUnassignUsers = async (cycleId: string, userIds: string[]) => {
    // FIX: Use v8 syntax for batch operations.
    const batch = db.batch();

    // 1. Delete the cycle document
    const cycleRef = db.collection(CYCLES_COLLECTION).doc(cycleId);
    batch.delete(cycleRef);

    // 2. Unassign all users from the deleted cycle
    userIds.forEach(uid => {
        const userRef = db.collection(USERS_COLLECTION).doc(uid);
        batch.update(userRef, { cycleId: firebase.firestore.FieldValue.delete() });
    });

    await batch.commit();
};

export const removeMemberFromCycleAndUpdateUser = async (cycleId: string, updatedCycle: RoscaCycle, memberIdToRemove: string) => {
    // FIX: Use v8 syntax for batch operations.
    const batch = db.batch();

    // 1. Update the cycle with the member removed
    const cycleRef = db.collection(CYCLES_COLLECTION).doc(cycleId);
    const { id, ...dataToSave } = updatedCycle;
    batch.set(cycleRef, dataToSave);
    
    // 2. Unassign the user from the cycle
    // FIX: Corrected typo in collection name from 'USERS_COLlection' to 'USERS_COLLECTION'.
    const userRef = db.collection(USERS_COLLECTION).doc(memberIdToRemove);
    batch.update(userRef, { cycleId: firebase.firestore.FieldValue.delete() });

    await batch.commit();
};

export const addMembersToCycleAndUpdateUsers = async (cycleId: string, updatedCycle: RoscaCycle, newUserIds: string[]) => {
    // FIX: Use v8 syntax for batch operations.
    const batch = db.batch();
    
    // 1. Update the cycle with the new members
    const cycleRef = db.collection(CYCLES_COLLECTION).doc(cycleId);
    const { id, ...dataToSave } = updatedCycle;
    batch.set(cycleRef, dataToSave);

    // 2. Assign the new users to this cycle
    newUserIds.forEach(uid => {
        const userRef = db.collection(USERS_COLLECTION).doc(uid);
        batch.update(userRef, { cycleId: cycleId });
    });

    await batch.commit();
};

export const updateUserAndCycles = async (uid: string, updatedUserData: Partial<AppUser>, cyclesToUpdate: RoscaCycle[]) => {
    // FIX: Use v8 syntax for batch operations.
    const batch = db.batch();

    // 1. Update the user document
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    batch.update(userRef, updatedUserData);

    // 2. Update the member details in each cycle the user belongs to
    cyclesToUpdate.forEach(cycle => {
        const updatedMembers = cycle.members.map(member => 
            member.id === uid ? { ...member, ...updatedUserData } : member
        );
        const cycleRef = db.collection(CYCLES_COLLECTION).doc(cycle.id);
        batch.update(cycleRef, { members: updatedMembers });
    });

    await batch.commit();
};

export const importData = async (data: { cycles: RoscaCycle[], users: AppUser[] }) => {
    if (!data.cycles || !data.users) {
        throw new Error("Invalid data format. 'cycles' and 'users' arrays are required.");
    }

    // FIX: Use v8 syntax for batch and query operations.
    const batch = db.batch();

    const cyclesQuery = db.collection(CYCLES_COLLECTION);
    const cyclesSnapshot = await cyclesQuery.get();
    cyclesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    const usersQuery = db.collection(USERS_COLLECTION);
    const usersSnapshot = await usersQuery.get();
    usersSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    data.cycles.forEach(cycle => {
        const { id, ...cycleData } = cycle;
        const cycleRef = db.collection(CYCLES_COLLECTION).doc(id);
        batch.set(cycleRef, cycleData);
    });

    data.users.forEach(user => {
        const userRef = db.collection(USERS_COLLECTION).doc(user.uid);
        batch.set(userRef, user);
    });

    await batch.commit();
};