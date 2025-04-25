import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import localeEn from '@angular/common/locales/en';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';

registerLocaleData(localeAr, 'ar');
registerLocaleData(localeEn, 'en');
@NgModule({
    declarations: [],
    imports: [CommonModule, CommonModule, TranslateModule, FormsModule, TableModule, ButtonModule, CalendarModule, DialogModule, ToastModule, DropdownModule, TextareaModule]
})
export class SharedModule {}
