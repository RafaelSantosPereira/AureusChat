import { Injectable, inject } from '@angular/core';
import { collection, addDoc, doc, setDoc, query, orderBy } from 'firebase/firestore';
import { AuthService } from '../auth.service';
import { Firestore, collectionData } from '@angular/fire/firestore';
import { v4 as uuidv4 } from 'uuid';
import { getDocs } from 'firebase/firestore';


@Injectable({ providedIn: 'root' })
export class ChatService {
  firestore = inject(Firestore);
  authService = inject(AuthService);

  get userId() {
    return this.authService.currentUserSig()?.uid;
  }

  async createChat(title: string) {
    const id = uuidv4();
    const chatRef = doc(this.firestore, `users/${this.userId}/chats/${id}`);
    await setDoc(chatRef, {
      id,
      title,
      createdAt: Date.now(),
    });
    return id;
  }

 getChats() {
  const chatCollection = collection(this.firestore, `users/${this.userId}/chats`);
  const chatsQuery = query(chatCollection, orderBy('createdAt', 'desc'));
  return collectionData(chatsQuery, { idField: 'id' });
}

  getMessages(chatId: string) {
    const messagesCollection = collection(this.firestore, `users/${this.userId}/chats/${chatId}/messages`);
    const messagesQuery = query(messagesCollection, orderBy('timestamp'));
    return collectionData(messagesQuery, { idField: 'id' });
  }

 async addMessage(chatId: string, sender: 'user' | 'ai', text: string) {
  const userId = this.userId;
  const messagesCollection = collection(this.firestore, `users/${userId}/chats/${chatId}/messages`);
  await addDoc(messagesCollection, {
    sender,
    text,
    timestamp: Date.now(),
  });

  // Se for a primeira mensagem no chat enviada pelo user, usa esse texto como título (truncado)
  if (sender === 'user') {
    const snapshot = await getDocs(messagesCollection);
    if (snapshot.size === 1) {
      const chatDocRef = doc(this.firestore, `users/${userId}/chats/${chatId}`);
      const MAX_TITLE_LENGTH = 25;
      const truncatedTitle = text.length > MAX_TITLE_LENGTH ? text.slice(0, MAX_TITLE_LENGTH) + '…' : text;

      await setDoc(chatDocRef, { title: truncatedTitle }, { merge: true });
    }
  }
}

  
}
