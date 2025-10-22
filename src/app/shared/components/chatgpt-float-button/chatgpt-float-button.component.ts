import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-chatgpt-float-button',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './chatgpt-float-button.component.html',
    styleUrls: ['./chatgpt-float-button.component.scss']
})
export class ChatgptFloatButtonComponent {
    readonly url = 'https://chatgpt.com/g/g-68e8f9ed9ad881918a5be76d6f0c270b-kidskills-ld-specialist-assistant';

    open(event?: Event) {
        if (event) {
            try {
                event.stopPropagation();
            } catch {}
        }
        window.open(this.url, '_blank', 'noopener');
    }
}
