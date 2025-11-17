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
    videoUrl?: string;
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
        const GAME_LIST: { [key: number]: { title: string; videoUrl?: string } } = {
            1: { title: 'لعبه استخراج المختلف (اشكال-الوان-احجام)', videoUrl: 'https://www.youtube.com/watch?v=xAn87y-qvXA' },
            2: { title: 'استخراج الصوره التي لا تنتمي للمجموعه', videoUrl: 'https://youtu.be/DFCVUf9qmWM' },
            3: { title: 'نشاط الشطب' },
            4: { title: 'اختر الشكل المنتمي للمجموعة' },
            5: { title: 'نشاط التطابق البصري' },
            6: { title: 'نشاط اوجد الاختلافات بين الصورتين' },
            7: { title: 'لعبه المتاهات لزياده مده الانتباه' },
            8: { title: 'لفت واتساق الانتباه' },
            9: { title: 'استخرج الكلمه والرمز من متعدد' },
            10: { title: 'لعبه التمييز السمعي للاصوات' },
            11: { title: 'المرونه في نقل الانتباه الالوان' },
            12: { title: 'المرونه في الانتباه السمعي للحروف' },
            13: { title: 'زياده مده الانتباه البصري' },
            14: { title: 'التمييز البصري للصور المشفره' },
            15: { title: 'التمييز البصري بين الالوان والاحجام والاشكال' },
            16: { title: 'تصنيف اثاث المنزل' },
            17: { title: 'لعبه تصنيف الطعام' },
            18: { title: 'تصنيف الملابس' },
            19: { title: 'التمييز البصري للالوان' },
            20: { title: 'العلاقات بين الاشياء' },
            21: { title: 'تطابق الشكل بالظل' },
            22: { title: 'الادراك البصري الشكل والارضيه' },
            23: { title: 'الاغلاق البصري للارقام والحروف' },
            24: { title: 'ادراك العلاقات المكانيه' },
            25: { title: 'الذاكره البصريه للبطاقات' },
            26: { title: 'التسلسل البصري' },
            27: { title: 'التتبع البصري' },
            28: { title: 'سرعه التطابق البصري' },
            29: { title: 'ادراك بصري لثبات الشكل' },
            30: { title: 'تدريب الذاكره السمعيه العامله' },
            31: { title: 'تدريب الذاكره العكسيه (سمعية - بصرية)' },
            32: { title: 'نشاط الذاكره العكسيه (سمعية)' },
            33: { title: 'نشاط الاحتفاظ السمعي' },
            34: { title: 'نشاط استدعاء البطاقات من الذاكره البصريه' },
            35: { title: 'لعبه الذاكره المكانيه' },
            36: { title: 'لعبه نسخ النمط' },
            37: { title: 'الذاكره السمعيه التسلسل الايقاعي' },
            38: { title: 'الذاكره الاسترجاعيه' },
            39: { title: 'الذاكره القصيره المؤجله' },
            40: { title: 'بطاقات الذاكره البصريه' },
            41: { title: 'ترتيب احداث قصه' },
            42: { title: 'تدريب الذاكره العامله' },
            43: { title: 'لعبه اجزاء الكلام' },
            44: { title: 'لعبه عدد المقاطع الصوتيه' },
            45: { title: 'لعبه تركيب الكلمه من المقاطع الصوتيه' },
            46: { title: 'نشاط القافيه' },
            47: { title: 'لعبه تفكيك الكلمات الي اصوات' },
            48: { title: 'اوجد الحرف الناقص' },
            49: { title: 'انقص حرف من الكلمه' },
            50: { title: 'لعبه تقطيع الكلمات' },
            51: { title: 'الكلمات المفرده ومعناها' },
            52: { title: 'استكشاف المعني من السياق' }
        };

        // Generate games up to 52 using GAME_LIST map
        for (let i = 1; i <= 52; i++) {
            const gameData = GAME_LIST[i];
            this.games.push({
                id: i,
                title: gameData?.title || `لعبة ${i}`,
                description: `وصف اللعبة رقم ${i}`,
                icon: 'pi pi-microsoft',
                route: `/app/game/${i}`,
                videoUrl: gameData?.videoUrl
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
                // Subcategory filtering disabled by request: include all ids from category regardless of selectedSubcat
                const allIds = cat.subcats.flatMap((s) => s.ids);
                list = list.filter((g) => allIds.includes(g.id));
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
        // Subcategory selection is disabled — keep property for compatibility but do not trigger filtering
        this.selectedSubcat = null;
    }

    navigateToGame(gameRoute: string) {
        this.router.navigate([gameRoute]);
    }

    goBack() {
        this.router.navigate(['/app/selection']);
    }
}
