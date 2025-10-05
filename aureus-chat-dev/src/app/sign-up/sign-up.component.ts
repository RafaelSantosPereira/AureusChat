import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, NgIf],
  templateUrl: './sign-up.component.html',
})

export class SignUpComponent {
  fb = inject(FormBuilder);
  http = inject(HttpClient);
  authService = inject(AuthService)
  router = inject(Router);

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    password2: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(group: any) {
    const password = group.get('password')?.value;
    const password2 = group.get('password2')?.value;
    return password === password2 ? null : { passwordsMismatch: true };
  }
  errorMessage: string | null = null;

  onSubmit(): void {
    const { email, username, password, password2 } = this.form.getRawValue();
  
    if (password !== password2) {
      this.errorMessage = 'As passwords não coincidem';
      return;
    }
  
    this.authService.register(email, username, password).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err) => {
        console.error(err);
        this.errorMessage = err.message;

        if (err.code === 'auth/email-already-in-use') {
          this.form.get('email')?.setErrors({ emailExists: true });
        }
        if (err.code === 'auth/weak-password') {
          this.form.get('password')?.setErrors({ weekPassword: true });
        }

        this.form.updateValueAndValidity();
      }
    });
   
    console.log('register');
  }
}



