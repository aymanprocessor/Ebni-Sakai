import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-chatgpt-assistant-button',
    standalone: true,
    imports: [CommonModule, ButtonModule, TranslateModule],
    templateUrl: './chatgpt-assistant-button.component.html',
    styleUrls: ['./chatgpt-assistant-button.component.scss']
})
export class ChatgptAssistantButtonComponent {
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
