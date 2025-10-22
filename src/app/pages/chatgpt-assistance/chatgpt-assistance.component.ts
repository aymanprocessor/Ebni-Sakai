import { Component } from '@angular/core';
import { ChatgptAssistantButtonComponent } from '../../shared/components/chatgpt-assistant-button/chatgpt-assistant-button.component';

@Component({
    selector: 'app-chatgpt-assistance',
    standalone: true,
    imports: [ChatgptAssistantButtonComponent],
    templateUrl: './chatgpt-assistance.component.html',
    styleUrls: ['./chatgpt-assistance.component.scss']
})
export class ChatgptAssistanceComponent {}
