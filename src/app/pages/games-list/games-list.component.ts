import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { PermissionService } from '../../services/permission.service';
import { Logger } from '../../services/logger.service';
import { SkeletonModule } from 'primeng/skeleton';

interface Game {
    id: number;
    title: string;
    description: string;
    icon: string;
    route: string;
}

@Component({
    selector: 'app-games-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, CardModule, ButtonModule, TranslateModule, InputTextModule, SkeletonModule],
    templateUrl: './games-list.component.html',
    styleUrls: ['./games-list.component.scss']
})
export class GamesListComponent implements OnInit {
    games: Game[] = [];
    filteredGames: Game[] = [];
    searchTerm: string = '';
    // null = not yet loaded, [] = loaded but user has no access
    accessibleGameIds: number[] | null = null;
    private accessibleGameIdsInitialized = false;
    // Categories with nested subcategories and ids
    categories: Array<{
        key: string;
        label: string;
        subcats: Array<{ key: string; label: string; ids: number[] }>;
    }> = [
        {
            key: 'attention',
            label: 'الانتباه',
            subcats: [{ key: 'all', label: 'الكل', ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] }]
        },
        {
            key: 'perception',
            label: 'الادراك',
            subcats: [
                { key: 'visual', label: 'بصري', ids: [14, 15, 16, 17, 18] },
                { key: 'auditory', label: 'سمعي', ids: [19, 20, 21, 22, 23] },
                { key: 'audioVisual', label: 'سمعي وبصري', ids: [24, 25, 26, 27, 28, 29] }
            ]
        },
        {
            key: 'memory',
            label: 'الذاكرة',
            subcats: [
                { key: 'visual', label: 'بصري', ids: [30, 31, 32, 33, 34] },
                { key: 'auditory', label: 'سمعي', ids: [35, 36, 37, 38, 39] },
                { key: 'audioVisual', label: 'سمعي وبصري', ids: [40, 41, 42] }
            ]
        },
        {
            key: 'reading',
            label: 'القراءة',
            subcats: [{ key: 'all', label: 'الكل', ids: [43, 44, 45, 46, 47, 48, 49, 50, 51, 52] }]
        }
    ];

    selectedCategory: string | null = null;
    selectedSubcat: string | null = null;

    get visibleSubcats() {
        const cat = this.categories.find((c) => c.key === this.selectedCategory);
        return cat ? cat.subcats : [];
    }

    get hasSubcats() {
        const cat = this.categories.find((c) => c.key === this.selectedCategory);
        return cat && cat.subcats.length > 1;
    }

    constructor(
        private router: Router,
        private permissionService: PermissionService,
        private ngZone: NgZone,
        private cd: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.initializeGames();
        // Load accessible game IDs based on user permissions
        this.permissionService.getAccessibleGameIds().subscribe((ids) => {
            // Firebase/AngularFire can emit outside Angular's zone; ensure UI updates by running inside NgZone
            this.ngZone.run(() => {
                this.accessibleGameIds = ids;
                this.accessibleGameIdsInitialized = true;
                Logger.log('GamesList: accessibleGameIds emitted:', ids);
                this.filterGames();
                // ensure change detection picks up the changes
                try {
                    this.cd.detectChanges();
                } catch (e) {
                    // detectChanges may fail during some lifecycle moments; mark for check instead
                    this.cd.markForCheck();
                }
            });
        });
    }

    initializeGames() {
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

        // Generate games up to 52 using titles map
        for (let i = 1; i <= 52; i++) {
            this.games.push({
                id: i,
                title: GAME_TITLES[i] || `لعبة ${i}`,
                description: `وصف اللعبة رقم ${i}`,
                icon: 'pi pi-microsoft',
                route: `/app/game/${i}`
            });
        }
    }

    filterGames() {
        Logger.log('GamesList.filterGames start - accessibleGameIds:', this.accessibleGameIds, 'initialized:', this.accessibleGameIdsInitialized, 'selectedCategory:', this.selectedCategory, 'searchTerm:', this.searchTerm);
        const term = this.searchTerm?.trim();
        let list = [...this.games];

        // Permissions handling:
        // - accessibleGameIds === null -> permissions not loaded yet: keep showing initial list until loaded
        // - accessibleGameIds is [] -> loaded and user has NO access: show empty list
        // - accessibleGameIds has items -> filter by them
        if (this.accessibleGameIds === null) {
            // permissions not loaded yet: do not apply permission filtering
        } else if (this.accessibleGameIds.length === 0 && this.accessibleGameIdsInitialized) {
            // permissions loaded and user has no access -> return empty
            this.filteredGames = [];
            return;
        } else {
            // has some allowed ids
            list = list.filter((g) => (this.accessibleGameIds ?? []).includes(g.id));
        }

        if (this.selectedCategory) {
            const cat = this.categories.find((c) => c.key === this.selectedCategory);
            if (cat) {
                if (this.selectedSubcat) {
                    const sub = cat.subcats.find((s) => s.key === this.selectedSubcat);
                    if (sub) {
                        list = list.filter((g) => sub.ids.includes(g.id));
                    }
                } else {
                    // if no subcat selected, include all ids from category
                    const allIds = cat.subcats.flatMap((s) => s.ids);
                    list = list.filter((g) => allIds.includes(g.id));
                }
            }
        }

        if (!term) {
            this.filteredGames = list;
            return;
        }

        this.filteredGames = list.filter((game) => game.title.includes(term) || game.id.toString().includes(term));
    }

    selectCategory(catKey: string | null) {
        this.selectedCategory = catKey;
        this.selectedSubcat = null;
        this.filterGames();
    }

    selectSubcat(subKey: string | null) {
        this.selectedSubcat = subKey;
        this.filterGames();
    }

    navigateToGame(gameRoute: string) {
        this.router.navigate([gameRoute]);
    }

    goBack() {
        this.router.navigate(['/app/selection']);
    }
}
