import { Component, Input, input, OnChanges, SimpleChanges } from '@angular/core';
import { AgeResult } from '../../../models/age-result.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'age-sage',
    imports: [CommonModule, FormsModule, ButtonModule, DatePickerModule, CardModule],
    templateUrl: './age-sage.component.html',
    styleUrl: './age-sage.component.scss'
})
export class AgeSageComponent implements OnChanges {
    @Input({ required: true }) birthdate: Date | null = null;
    result: AgeResult | null = null;

    ngOnChanges(changes: SimpleChanges): void {
        console.debug('From Changes', changes['birthdate'].currentValue);
        if (changes['birthdate'] && changes['birthdate'].currentValue) {
            this.result = this.calculateAge(changes['birthdate'].currentValue);
        }
    }

    /**
     * Calculate age in years, months and days
     */
    calculateAge(birthDate: Date): AgeResult {
        const today = new Date();

        // Clone dates to avoid modifying the originals
        const currentDate = new Date(today);
        const birthDateClone = new Date(birthDate);

        // Calculate years
        let years = currentDate.getFullYear() - birthDateClone.getFullYear();

        // Calculate months
        let months = currentDate.getMonth() - birthDateClone.getMonth();

        // Calculate days
        let days = currentDate.getDate() - birthDateClone.getDate();

        // Adjust if days are negative
        if (days < 0) {
            // Get last day of previous month for current date
            const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
            days += lastMonth.getDate();
            months--;
        }

        // Adjust if months are negative
        if (months < 0) {
            months += 12;
            years--;
        }
        console.debug('from calculate age', this.formatArabic(years, months, days));
        return {
            years,
            months,
            days,
            englishText: this.formatEnglish(years, months, days),
            arabicText: this.formatArabic(years, months, days)
        };
    }

    /**
     * Format age in English with proper plurals
     */
    private formatEnglish(years: number, months: number, days: number): string {
        const yearText = years === 1 ? 'year' : 'years';
        const monthText = months === 1 ? 'month' : 'months';
        const dayText = days === 1 ? 'day' : 'days';

        let result = '';

        if (years > 0) {
            result += `${years} ${yearText}`;
        }

        if (months > 0) {
            if (result) result += ', ';
            result += `${months} ${monthText}`;
        }

        if (days > 0 || (years === 0 && months === 0)) {
            if (result) {
                if (months === 0) {
                    result += ' and ';
                } else {
                    result += ', ';
                }
            }
            result += `${days} ${dayText}`;
        }

        return result;
    }

    /**
     * Format age in Arabic with complex pluralization rules
     */
    private formatArabic(years: number, months: number, days: number): string {
        let result = '';

        // Years in Arabic
        if (years > 0) {
            if (years === 1) {
                result += 'سنة واحدة';
            } else if (years === 2) {
                result += 'سنتان';
            } else if (years >= 3 && years <= 10) {
                result += `${years} سنوات`;
            } else {
                result += `${years} سنة`;
            }
        }

        // Months in Arabic
        if (months > 0) {
            if (result) result += '، ';

            if (months === 1) {
                result += 'شهر واحد';
            } else if (months === 2) {
                result += 'شهران';
            } else if (months >= 3 && months <= 10) {
                result += `${months} أشهر`;
            } else {
                result += `${months} شهراً`;
            }
        }

        // Days in Arabic
        if (days > 0 || (years === 0 && months === 0)) {
            if (result) {
                if (months === 0 && years > 0) {
                    result += ' و ';
                } else {
                    result += '، ';
                }
            }

            if (days === 1) {
                result += 'يوم واحد';
            } else if (days === 2) {
                result += 'يومان';
            } else if (days >= 3 && days <= 10) {
                result += `${days} أيام`;
            } else {
                result += `${days} يوماً`;
            }
        }

        return result;
    }

    /**
     * Handle calculate button click
     */
    // onCalculate(): void {
    //     if (this.birthDate) {
    //         Logger.log('From Age Sage', this.birthDate);
    //         this.result = this.calculateAge(this.birthDate);
    //     }
    // }
}
