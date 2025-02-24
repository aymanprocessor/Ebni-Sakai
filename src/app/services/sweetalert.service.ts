import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class SweetalertService {
  showSuccess(message: string, title: string = 'Success') {
    Swal.fire({
      title: title,
      text: message,
      icon: 'success',
      confirmButtonColor: '#3085d6',
    });
  }

  showError(message: string, title: string = 'Error') {
    Swal.fire({
      title: title,
      text: message,
      icon: 'error',
      confirmButtonColor: '#d33',
    });
  }

  showWarning(message: string, title: string = 'Warning') {
    Swal.fire({
      title: title,
      text: message,
      icon: 'warning',
      confirmButtonColor: '#f39c12',
    });
  }

  showInfo(message: string, title: string = 'Info') {
    Swal.fire({
      title: title,
      text: message,
      icon: 'info',
      confirmButtonColor: '#17a2b8',
    });
  }

  showToast(message: string, icon: 'success' | 'error' | 'warning' | 'info') {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: icon,
      title: message,
      showConfirmButton: false,
      timer: 5000, // Auto-close after 5 seconds
      timerProgressBar: true,
      customClass: {
        popup: `custom-toast ${icon}-toast`, // Add custom class
      },
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer); // Pause on hover
        toast.addEventListener('mouseleave', Swal.resumeTimer); // Resume timer
      },
    });
  }
}
