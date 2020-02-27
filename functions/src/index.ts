import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const MAX_MSG_LENGTH = 50;
const MAX_DOC_LENGTH = 10000;

const db = admin.firestore();
db.settings({ timestampsInSnapshots: true });

// TODO: run function to clean up excess messages
export const archiveOldMsgs = functions.firestore
  .document("chats/{chatId}")
  .onUpdate(change => {
    const data = change.after.data();
    if (!data) {
      return null;
    }
    const msgLength = data.messages.length;
    const docLength = JSON.stringify(data).length;

    const batch = db.batch();

    if (docLength >= MAX_DOC_LENGTH || msgLength >= MAX_MSG_LENGTH) {
      data.messages.splice(0, msgLength - MAX_MSG_LENGTH);
      const docRef = db.collection("chats").doc(change.after.id);
      batch.set(docRef, data, { merge: true });

      return batch.commit();
    } else {
      return null;
    }
  });
