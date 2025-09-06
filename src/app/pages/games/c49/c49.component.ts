import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'app-c49',
    template: `
        <div #gameContainer class="game-wrapper">
            <iframe class="game-iframe" [src]="gameUrl" frameborder="0"> </iframe>
        </div>
    `,
    styles: [
        `
            .game-wrapper {
                width: 100%;
                height: 100vh;
                margin: 0;
                padding: 0;
                overflow: hidden;
            }

            .game-iframe {
                width: 100%;
                height: 100vh;
                border: none;
                margin: 0;
                padding: 0;
                display: block;
            }

            :host {
                display: block;
                width: 100%;
                height: 100vh;
                margin: 0;
                padding: 0;
            }
        `
    ]
})
export class C49Component implements OnInit {
    gameUrl: any;

    constructor(private sanitizer: DomSanitizer) {}

    ngOnInit() {
        this.gameUrl = this.sanitizer.bypassSecurityTrustResourceUrl('/assets/games/49.html');
    }
}
