import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GoogleTagManagerModule } from 'angular-google-tag-manager';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule],
    template: `<router-outlet></router-outlet>`
})
export class AppComponent {}
