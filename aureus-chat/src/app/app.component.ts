import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from "./sidebar/sidebar.component";
import { AuthService } from './auth.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'aureus-chat';
  authService = inject(AuthService)
  router = inject(Router);

  ngOnInit(): void {
    this.authService.user$.subscribe(user =>{
      if(user){
        this.authService.currentUserSig.set({
          uid: user.uid,
          email: user.email! ,
          username: user.displayName!
        })

      }
      else{
        this.authService.currentUserSig.set(null)
        this.router.navigateByUrl('/sign-in');
      }

      console.log(this.authService.currentUserSig())
    })
    
  }

  logout():void{
    this.authService.logout();
  }
}
