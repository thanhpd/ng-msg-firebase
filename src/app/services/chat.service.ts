import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { firestore } from 'firebase';
import { AuthService } from './auth.service';
import { map, switchMap, tap } from 'rxjs/operators';
import { Observable, combineLatest, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(
    private router: Router,
    private afStore: AngularFirestore,
    private authService: AuthService
  ) {}

  getRoomHistory(roomId) {
    return this.afStore
      .collection<any>('chats')
      .doc(roomId)
      .snapshotChanges()
      .pipe(
        map(doc => {
          const data: any = doc.payload.data();
          return { id: doc.payload.id, ...data };
        })
      );
  }

  getUserChats() {
    return this.authService.user$.pipe(
      switchMap(user => {
        return this.afStore
          .collection('chats', ref => ref.where('uid', '==', user.uid))
          .snapshotChanges()
          .pipe(
            map(actions => {
              return actions.map(a => {
                const data: Object = a.payload.doc.data();
                const id = a.payload.doc.id;
                return { id, ...data };
              });
            })
          );
      })
    );
  }

  async createRoom() {
    const { uid } = await this.authService.getUser();
    const data = { uid, createdAt: Date.now(), count: 0, messages: [] };

    const docRef = await this.afStore.collection('chats').add(data);

    return this.router.navigate(['room', docRef.id]);
  }

  async sendMessage(roomId, content) {
    const { uid } = await this.authService.getUser();

    if (uid) {
      const data = { uid, createdAt: Date.now(), content };
      const chatRoomDoc = this.afStore.collection('chats').doc(roomId);
      return chatRoomDoc.update({
        messages: firestore.FieldValue.arrayUnion(data)
      });
    }
  }

  async deleteMessage(room, message) {
    const { uid } = await this.authService.getUser();

    if (room.uid === uid || message.uid === uid) {
      delete message.user;
      const chatRoomDoc = this.afStore.collection('chats').doc(room.id);
      return chatRoomDoc.update({
        messages: firestore.FieldValue.arrayRemove(message)
      });
    }
  }

  mapWithUser(room$: Observable<any>) {
    let currentRoom: any;
    const userTable = {};

    return room$.pipe(
      switchMap(room => {
        // Get unique user ids from each chat room
        currentRoom = room;
        const uids = Array.from(new Set(room.messages.map(m => m.uid)));

        // Get user info of each uid in Observable
        const userDocs = uids.map(uid =>
          this.afStore.doc(`users/${uid}`).valueChanges()
        );

        return userDocs.length > 0 ? combineLatest(userDocs) : of([]);
      }),
      map(users => {
        users.forEach((user: any) => (userTable[user.uid] = user));
        currentRoom.messages = currentRoom.messages.map(msg => ({
          ...msg,
          user: userTable[msg.uid]
        }));

        return currentRoom;
      })
    );
  }
}
