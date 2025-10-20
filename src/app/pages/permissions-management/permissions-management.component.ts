import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TabViewModule } from 'primeng/tabview';
import { DropdownModule } from 'primeng/dropdown';
import { TranslateModule } from '@ngx-translate/core';
import { PermissionService } from '../../services/permission.service';
import { RolePermissions } from '../../models/permission.model';
import { SweetalertService } from '../../services/sweetalert.service';
import { Logger } from '../../services/logger.service';

interface GameInfo {
    id: number;
    title: string;
}

interface ScaleInfo {
    id: number;
    title: string;
}

@Component({
    selector: 'app-permissions-management',
    standalone: true,
    imports: [CommonModule, FormsModule, CardModule, ButtonModule, CheckboxModule, TabViewModule, DropdownModule, TranslateModule],
    templateUrl: './permissions-management.component.html',
    styleUrls: ['./permissions-management.component.scss']
})
export class PermissionsManagementComponent implements OnInit {
    selectedRole: string = 'specialist';
    roles = [
        { label: 'مستخدم (User)', value: 'user' },
        { label: 'متخصص (Specialist)', value: 'specialist' },
        { label: 'مشترك (Paid)', value: 'paid' }
    ];

    games: GameInfo[] = [];
    scales: ScaleInfo[] = [];

    currentPermissions: RolePermissions = {
        role: 'specialist',
        gamePermissions: [],
        scalePermissions: []
    };

    loading: boolean = false;
    selectAllGames: boolean = false;
    selectAllScales: boolean = false;

    constructor(
        private permissionService: PermissionService,
        private sweetalert: SweetalertService
    ) {}

    ngOnInit(): void {
        this.initializeGames();
        this.initializeScales();
        this.loadPermissions();
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

    loadPermissions(): void {
        this.loading = true;
        this.permissionService.getRolePermissions(this.selectedRole).subscribe({
            next: (permissions) => {
                if (permissions) {
                    this.currentPermissions = permissions;
                    this.updateSelectAllStates();
                }
                this.loading = false;
            },
            error: (error) => {
                Logger.error('Error loading permissions:', error);
                this.sweetalert.showToast('فشل في تحميل الصلاحيات', 'error');
                this.loading = false;
            }
        });
    }

    onRoleChange(): void {
        this.currentPermissions.role = this.selectedRole as any;
        this.loadPermissions();
    }

    isGameChecked(gameId: number): boolean {
        return this.currentPermissions.gamePermissions.includes(gameId);
    }

    isScaleChecked(scaleId: number): boolean {
        return this.currentPermissions.scalePermissions.includes(scaleId);
    }

    onGameCheckboxChange(gameId: number, checked: boolean): void {
        if (checked) {
            if (!this.currentPermissions.gamePermissions.includes(gameId)) {
                this.currentPermissions.gamePermissions.push(gameId);
            }
        } else {
            this.currentPermissions.gamePermissions = this.currentPermissions.gamePermissions.filter((id) => id !== gameId);
        }
        this.updateSelectAllStates();
    }

    onScaleCheckboxChange(scaleId: number, checked: boolean): void {
        if (checked) {
            if (!this.currentPermissions.scalePermissions.includes(scaleId)) {
                this.currentPermissions.scalePermissions.push(scaleId);
            }
        } else {
            this.currentPermissions.scalePermissions = this.currentPermissions.scalePermissions.filter((id) => id !== scaleId);
        }
        this.updateSelectAllStates();
    }

    toggleAllGames(checked: boolean): void {
        if (checked) {
            this.currentPermissions.gamePermissions = this.games.map((g) => g.id);
        } else {
            this.currentPermissions.gamePermissions = [];
        }
        this.selectAllGames = checked;
    }

    toggleAllScales(checked: boolean): void {
        if (checked) {
            this.currentPermissions.scalePermissions = this.scales.map((s) => s.id);
        } else {
            this.currentPermissions.scalePermissions = [];
        }
        this.selectAllScales = checked;
    }

    updateSelectAllStates(): void {
        this.selectAllGames = this.currentPermissions.gamePermissions.length === this.games.length;
        this.selectAllScales = this.currentPermissions.scalePermissions.length === this.scales.length;
    }

    async savePermissions(): Promise<void> {
        try {
            this.loading = true;
            await this.permissionService.updateRolePermissions(this.currentPermissions);
            this.sweetalert.showToast('تم حفظ الصلاحيات بنجاح', 'success');
            this.loading = false;
        } catch (error) {
            Logger.error('Error saving permissions:', error);
            this.sweetalert.showToast('فشل في حفظ الصلاحيات', 'error');
            this.loading = false;
        }
    }

    getPermissionStats(): string {
        const gameCount = this.currentPermissions.gamePermissions.length;
        const scaleCount = this.currentPermissions.scalePermissions.length;
        return `الألعاب: ${gameCount}/52 | المقاييس: ${scaleCount}/7`;
    }
}
