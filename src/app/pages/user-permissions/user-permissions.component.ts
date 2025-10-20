import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TabViewModule } from 'primeng/tabview';
import { DropdownModule } from 'primeng/dropdown';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CalendarModule } from 'primeng/calendar';
import { TranslateModule } from '@ngx-translate/core';
import { PermissionService } from '../../services/permission.service';
import { UserManagementService } from '../../services/user-management.service';
import { SweetalertService } from '../../services/sweetalert.service';
import { Logger } from '../../services/logger.service';
import { UserProfile } from '../../models/user.model';

interface GameInfo {
    id: number;
    title: string;
}

interface ScaleInfo {
    id: number;
    title: string;
}

@Component({
    selector: 'app-user-permissions',
    standalone: true,
    imports: [CommonModule, FormsModule, CardModule, ButtonModule, CheckboxModule, TabViewModule, DropdownModule, AutoCompleteModule, CalendarModule, TranslateModule],
    templateUrl: './user-permissions.component.html',
    styleUrls: ['./user-permissions.component.scss']
})
export class UserPermissionsComponent implements OnInit {
    users: UserProfile[] = [];
    filteredUsers: UserProfile[] = [];
    selectedUser: UserProfile | null = null;

    games: GameInfo[] = [];
    scales: ScaleInfo[] = [];

    userGamePermissions: number[] = [];
    userScalePermissions: number[] = [];
    // Expiry controls (optional)
    userGameAccessExpires: Date | null = null;
    userScaleAccessExpires: Date | null = null;

    loading: boolean = false;
    selectAllGames: boolean = false;
    selectAllScales: boolean = false;

    constructor(
        private permissionService: PermissionService,
        private userManagementService: UserManagementService,
        private sweetalert: SweetalertService
    ) {}

    ngOnInit(): void {
        this.initializeGames();
        this.initializeScales();
        this.loadUsers();
    }

    initializeGames(): void {
        const GAME_TITLES: { [key: number]: string } = {
            1: 'لعبه استخراج المختلف (اشكال-الوان-احجام)',
            2: 'استخراج الصوره التي لا تنتمي للمجموعه',
            3: 'نشاط الشطب',
            4: 'اكمل العنصر الناقص من المجموعه',
            5: 'نشاط التطابق البصري',
            6: 'نشاط اوجد الاختلافات بين الصورتين',
            7: 'لعبه المتاهات لزياده مده الانتباه',
            8: 'لفت واتساق الانتباه',
            9: 'استخرج الكلمه والرمز من متعدد',
            10: 'لعبه التمييز السمعي للاصوات',
            11: 'المرونه في نقل الانتباه الالوان',
            12: 'المرونه في الانتباه السمعي للحروف',
            13: 'زياده مده الانتباه البصري',
            14: 'التمييز البصري للصور المشفره',
            15: 'التمييز البصري بين الالوان والاحجام والاشكال',
            16: 'تصنيف اثاث المنزل',
            17: 'لعبه تصنيف الطعام',
            18: 'تصنيف الملابس',
            19: 'التمييز البصري للالوان',
            20: 'العلاقات بين الاشياء',
            21: 'تطابق الشكل بالظل',
            22: 'الادراك البصري الشكل والارضيه',
            23: 'الاغلاق البصري للارقام والحروف',
            24: 'ادراك العلاقات المكانيه',
            25: 'الذاكره البصريه للبطاقات',
            26: 'التسلسل البصري',
            27: 'التتبع البصري',
            28: 'سرعه التطابق البصري',
            29: 'ادراك بصري لثبات الشكل',
            30: 'تدريب الذاكره السمعيه العامله',
            31: 'تدريب الذاكره العكسيه',
            32: 'نشاط الذاكره العكسيه',
            33: 'نشاط الاحتفاظ السمعي',
            34: 'نشاط استدعاء البطاقات من الذاكره البصريه',
            35: 'لعبه الذاكره المكانيه',
            36: 'لعبه نسخ النمط',
            37: 'الذاكره السمعيه التسلسل الايقاعي',
            38: 'الذاكره الاسترجاعيه',
            39: 'الذاكره القصيره المؤجله',
            40: 'بطاقات الذاكره البصريه',
            41: 'ترتيب احداث قصه',
            42: 'تدريب الذاكره العامله',
            43: 'لعبه اجزاء الكلام',
            44: 'لعبه عدد المقاطع الصوتيه',
            45: 'لعبه تركيب الكلمه من المقاطع الصوتيه',
            46: 'نشاط القافيه',
            47: 'لعبه تفكيك الكلمات الي اصوات',
            48: 'اوجد الحرف الناقص',
            49: 'انقص حرف من الكلمه',
            50: 'لعبه تقطيع الكلمات',
            51: 'الكلمات المفرده ومعناها',
            52: 'استكشاف المعني من السياق'
        };

        for (let i = 1; i <= 52; i++) {
            this.games.push({
                id: i,
                title: GAME_TITLES[i] || `لعبة ${i}`
            });
        }
    }

    initializeScales(): void {
        this.scales = [
            { id: 1, title: 'مقياس صعوبات الانتباه' },
            { id: 2, title: 'مقياس صعوبه الذاكره' },
            { id: 3, title: 'مقياس الادراك الاستماعي' },
            { id: 4, title: 'مقياس صعوبات القراءه' },
            { id: 5, title: 'مقياس صعوبه الكتابه' },
            { id: 6, title: 'مقياس صعوبه الحساب' },
            { id: 7, title: 'مقياس لصعوبات السلوك الانفعالي والاجتماعي' }
        ];
    }

    loadUsers(): void {
        this.loading = true;
        this.userManagementService.getAllUsers().subscribe({
            next: (users) => {
                // Filter out admins from the list (admins shouldn't need custom permissions)
                this.users = users.filter((u) => u.role !== 'admin');
                this.loading = false;
            },
            error: (error) => {
                Logger.error('Error loading users:', error);
                this.sweetalert.showToast('فشل في تحميل المستخدمين', 'error');
                this.loading = false;
            }
        });
    }

    searchUsers(event: any): void {
        // Guard against undefined query (e.g. when dropdown button is clicked)
        const rawQuery = event?.query;
        const query = rawQuery ? String(rawQuery).toLowerCase().trim() : '';

        if (!query) {
            // If no query, show first 50 users as suggestions (or fewer)
            this.filteredUsers = this.users.slice(0, 50);
            return;
        }

        this.filteredUsers = this.users.filter((user) => {
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
            const email = (user.email || '').toLowerCase();
            return fullName.includes(query) || email.includes(query);
        });
    }

    onUserSelect(event: any): void {
        // AutoComplete passes the event with value property
        this.selectedUser = event.value || event;
        this.loadUserPermissions();
    }

    loadUserPermissions(): void {
        if (!this.selectedUser) return;

        // Load user-specific permissions or role defaults
        this.userGamePermissions = this.selectedUser.gamePermissions || [];
        this.userScalePermissions = this.selectedUser.scalePermissions || [];

        // Load expiries (convert to Date if needed) - normalize Firestore Timestamp / string / number to JS Date
        this.userGameAccessExpires = this.normalizeExpiry((this.selectedUser as any).gameAccessExpires);
        this.userScaleAccessExpires = this.normalizeExpiry((this.selectedUser as any).scaleAccessExpires);

        this.updateSelectAllStates();
    }

    // Normalize expiry values that may come from Firestore as Timestamp, number, string, or Date
    private normalizeExpiry(value: any): Date | null {
        if (!value) return null;
        // Firestore Timestamp
        if (typeof value?.toDate === 'function') {
            try {
                return value.toDate();
            } catch (e) {
                Logger.error('normalizeExpiry toDate failed', e);
                return null;
            }
        }
        // milliseconds since epoch
        if (typeof value === 'number') {
            const d = new Date(value);
            return isNaN(d.getTime()) ? null : d;
        }
        // ISO string or other string
        if (typeof value === 'string') {
            const d = new Date(value);
            return isNaN(d.getTime()) ? null : d;
        }
        // Already a Date
        if (value instanceof Date) {
            return isNaN(value.getTime()) ? null : value;
        }
        return null;
    }

    isGameChecked(gameId: number): boolean {
        return this.userGamePermissions.includes(gameId);
    }

    isScaleChecked(scaleId: number): boolean {
        return this.userScalePermissions.includes(scaleId);
    }

    onGameCheckboxChange(gameId: number, checked: boolean): void {
        if (checked) {
            if (!this.userGamePermissions.includes(gameId)) {
                this.userGamePermissions.push(gameId);
            }
        } else {
            this.userGamePermissions = this.userGamePermissions.filter((id) => id !== gameId);
        }
        this.updateSelectAllStates();
    }

    onScaleCheckboxChange(scaleId: number, checked: boolean): void {
        if (checked) {
            if (!this.userScalePermissions.includes(scaleId)) {
                this.userScalePermissions.push(scaleId);
            }
        } else {
            this.userScalePermissions = this.userScalePermissions.filter((id) => id !== scaleId);
        }
        this.updateSelectAllStates();
    }

    toggleAllGames(checked: boolean): void {
        if (checked) {
            this.userGamePermissions = this.games.map((g) => g.id);
        } else {
            this.userGamePermissions = [];
        }
        this.selectAllGames = checked;
    }

    toggleAllScales(checked: boolean): void {
        if (checked) {
            this.userScalePermissions = this.scales.map((s) => s.id);
        } else {
            this.userScalePermissions = [];
        }
        this.selectAllScales = checked;
    }

    updateSelectAllStates(): void {
        this.selectAllGames = this.userGamePermissions.length === this.games.length;
        this.selectAllScales = this.userScalePermissions.length === this.scales.length;
    }

    async savePermissions(): Promise<void> {
        if (!this.selectedUser) {
            this.sweetalert.showToast('يرجى اختيار مستخدم أولاً', 'warning');
            return;
        }

        try {
            this.loading = true;
            // Normalize expiry dates to start of day (00:00) to store date-only semantics
            const gameExpToSave = this.userGameAccessExpires ? this.startOfDay(this.userGameAccessExpires) : null;
            const scaleExpToSave = this.userScaleAccessExpires ? this.startOfDay(this.userScaleAccessExpires) : null;

            await this.permissionService.updateUserPermissions(this.selectedUser.uid, this.userGamePermissions, this.userScalePermissions, gameExpToSave, scaleExpToSave);
            this.sweetalert.showToast('تم حفظ صلاحيات المستخدم بنجاح', 'success');
            this.loading = false;
        } catch (error) {
            Logger.error('Error saving user permissions:', error);
            this.sweetalert.showToast('فشل في حفظ الصلاحيات', 'error');
            this.loading = false;
        }
    }

    // Return a Date representing start of day for given date (local time)
    private startOfDay(d: Date): Date {
        const out = new Date(d);
        out.setHours(0, 0, 0, 0);
        return out;
    }

    clearUserPermissions(): void {
        this.userGamePermissions = [];
        this.userScalePermissions = [];
        this.updateSelectAllStates();
    }

    getPermissionStats(): string {
        if (!this.selectedUser) return '';
        const gameCount = this.userGamePermissions.length;
        const scaleCount = this.userScalePermissions.length;
        return `الألعاب: ${gameCount}/52 | المقاييس: ${scaleCount}/7`;
    }

    getUserDisplayName(user: UserProfile): string {
        return `${user.firstName} ${user.lastName} (${user.email})`;
    }

    getUserRoleBadge(): string {
        if (!this.selectedUser) return '';
        switch (this.selectedUser.role) {
            case 'specialist':
                return 'متخصص';
            case 'paid':
                return 'مشترك';
            case 'user':
                return 'مستخدم';
            default:
                return this.selectedUser.role;
        }
    }

    hasCustomPermissions(): boolean {
        if (!this.selectedUser) return false;
        return !!(this.selectedUser.gamePermissions && this.selectedUser.gamePermissions.length > 0) || !!(this.selectedUser.scalePermissions && this.selectedUser.scalePermissions.length > 0);
    }
}
