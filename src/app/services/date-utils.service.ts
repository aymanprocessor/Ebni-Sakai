import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class DateUtilsService {
    constructor() {}

    /**
     * Calculates age in months from a given date
     * @param date The start date to calculate from
     * @returns Number of months between the given date and now
     */
    ageInMonthsFromDate(date: Date | string): number {
        const now = new Date();
        const dateObj = date instanceof Date ? date : new Date(date);

        // Validate date object
        if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid date provided');
        }

        // Calculate years difference
        let months = (now.getFullYear() - dateObj.getFullYear()) * 12;

        // Add months difference
        months += now.getMonth() - dateObj.getMonth();

        // Adjust for day difference if necessary
        if (now.getDate() < dateObj.getDate()) {
            months--;
        }

        return months;
    }
}
