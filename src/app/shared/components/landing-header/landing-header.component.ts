import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { UserProfile } from '../../../models/user.model';

@Component({
    selector: 'app-landing-header',
    standalone: true,
    imports: [CommonModule, RouterModule, TranslateModule, LanguageSelectorComponent],
    templateUrl: './landing-header.component.html',
    styleUrls: ['./landing-header.component.scss']
})
export class LandingHeaderComponent {
    currentUser$: Observable<UserProfile | null>;

    constructor(private authService: AuthService) {
        this.currentUser$ = this.authService.currentUser$;
    }
}
