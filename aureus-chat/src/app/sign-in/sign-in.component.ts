import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, NgIf],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent {
  fb = inject(FormBuilder);
  http = inject(HttpClient);
  authService = inject(AuthService)
  router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    
  });

  
  errorMessage: string | null = null;

  errorDisplay: string | null = null;

  onSubmit(): void {
    const { email, password } = this.form.getRawValue();
  
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // Marca todos os campos como "tocados" para ativar as mensagens de erro
      return; // Impede o envio do formulário se estiver inválido
    }
  
    this.authService.login(email, password).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err) => {
        console.error(err);
        this.errorMessage = err.message;

        this.errorDisplay = 'Wrong credentials';

       
        

        
      }
    });
   
    
  }
}
