import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Task } from './types';

/** Creates a task whose data ID and Firestore document ID are identical. */
export const createTask = (task: Omit<Task, 'id'>) => {
  const taskRef = doc(collection(db, 'tasks'));
  return setDoc(taskRef, { ...task, id: taskRef.id });
};
