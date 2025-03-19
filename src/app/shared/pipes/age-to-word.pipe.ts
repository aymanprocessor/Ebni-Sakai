import { Pipe, PipeTransform } from '@angular/core';
import { AgeResult } from '../../models/age-result.model';

@Pipe({
    name: 'ageToWord',
    pure: true
})
export class AgeToWordPipe implements PipeTransform {
    transform(birthDate: Date, format?: 'full' | 'english' | 'arabic'): AgeResult | string {
        if (!birthDate) {
            return '';
        }

        const result = this.calculateAge(birthDate);

        if (format === 'english') {
            return result.englishText;
        } else if (format === 'arabic') {
            return result.arabicText;
        }

        return result;
    }

    private calculateAge(birthDate: Date): AgeResult {
        const today = new Date();
        const currentDate = new Date(today);
        const birthDateClone = new Date(birthDate);

        let years = currentDate.getFullYear() - birthDateClone.getFullYear();
        let months = currentDate.getMonth() - birthDateClone.getMonth();
        let days = currentDate.getDate() - birthDateClone.getDate();

        if (days < 0) {
            const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
            days += lastMonth.getDate();
            months--;
        }

        if (months < 0) {
            months += 12;
            years--;
        }

        return {
            years,
            months,
            days,
            englishText: this.formatEnglish(years, months, days),
            arabicText: this.formatArabic(years, months, days)
        };
    }

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

    private formatArabic(years: number, months: number, days: number): string {
        let result = '';

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
}
