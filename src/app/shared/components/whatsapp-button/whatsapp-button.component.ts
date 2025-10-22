import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-whatsapp-button',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './whatsapp-button.component.html',
    styleUrls: ['./whatsapp-button.component.scss']
})
export class WhatsappButtonComponent {
    readonly whatsappNumber = '201556727127';
    readonly defaultMessage = 'اريد مساعدة';

    openWhatsApp(): void {
        const url = `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(this.defaultMessage)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}
