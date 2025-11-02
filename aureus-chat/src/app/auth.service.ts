import { inject, Injectable, signal } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, user } from '@angular/fire/auth'; 
import { from, Observable } from 'rxjs';
import { userInterface } from './user.interface';
import { signOut } from 'firebase/auth';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  firebaseAuth = inject(Auth)
  user$ = user(this.firebaseAuth)
  currentUserSig = signal<userInterface | null | undefined>(undefined)

  

  register(email: string, username: string, password: string): Observable<void> {
  const promise = createUserWithEmailAndPassword(this.firebaseAuth, email, password)
    .then(response => {
      const user = response.user;
      // Retornar a promise do updateProfile para esperar sua conclusão
      return updateProfile(user, { displayName: username })
        .then(() => {
          // Só definir o currentUserSig depois do updateProfile completar
          this.currentUserSig.set({
            uid: user.uid,
            email: user.email ?? '',
            username: username,
          });
        });
    });

  return from(promise);
}


  login(email: string, password: string): Observable<void> {
  const promise = signInWithEmailAndPassword(this.firebaseAuth, email, password)
    .then(response => {
      const user = response.user;
      this.currentUserSig.set({
        uid: user.uid,
        email: user.email ?? '',
        username: user.displayName ?? '',
      });
    });

  return from(promise);
}

  logout(): Observable<void>{
    const promise = signOut(this.firebaseAuth);
    return from(promise)
  }

}
