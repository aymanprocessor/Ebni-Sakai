import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface RegisterModel {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: string;
}

export class RegisterValidators {
    // Password match validator
    static passwordMatch(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const password = control.get('password');
            const confirmPassword = control.get('confirmPassword');

            if (password && confirmPassword && password.value !== confirmPassword.value) {
                return { passwordMismatch: true };
            }

            return null;
        };
    }

    // Strong password validator
    static strongPassword(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;

            if (!value) {
                return null;
            }

            // At least 8 characters long
            const lengthValid = value.length >= 8;

            // Contains at least one uppercase letter
            const uppercaseValid = /[A-Z]/.test(value);

            // Contains at least one lowercase letter
            const lowercaseValid = /[a-z]/.test(value);

            // Contains at least one number
            const numberValid = /[0-9]/.test(value);

            // Contains at least one special character
            const specialCharValid = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

            const passwordValid = lengthValid && uppercaseValid && lowercaseValid && numberValid && specialCharValid;

            return passwordValid
                ? null
                : {
                      strongPassword: {
                          lengthValid,
                          uppercaseValid,
                          lowercaseValid,
                          numberValid,
                          specialCharValid
                      }
                  };
        };
    }
}
