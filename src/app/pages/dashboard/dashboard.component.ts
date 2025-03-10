import { Component, inject, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-dashboard',
    imports: [TranslateModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    translateServ: TranslateService = inject(TranslateService);

    setLanguage(lang: string) {
        this.translateServ.use(lang);
    }
    ngOnInit() {}
}
