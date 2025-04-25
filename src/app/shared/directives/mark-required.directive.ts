// mark-required.directive.ts
import { Directive, ElementRef, Input, OnInit, Renderer2, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
    selector: '[markRequired]'
})
export class MarkRequiredDirective implements OnInit {
    constructor(
        private el: ElementRef,
        private renderer: Renderer2,
        @Optional() private control: NgControl
    ) {}

    ngOnInit(): void {
        if (this.control?.control?.validator) {
            const validators = this.control.control.validator({} as any);
            const isRequired = validators && validators['required'];
            if (isRequired) {
                const label = this.findLabel();
                if (label && !label.innerHTML.includes('*')) {
                    const asterisk = this.renderer.createElement('span');
                    this.renderer.setStyle(asterisk, 'color', 'red');
                    this.renderer.setStyle(asterisk, 'margin-left', '4px');
                    const text = this.renderer.createText('*');
                    this.renderer.appendChild(asterisk, text);
                    this.renderer.appendChild(label, asterisk);
                }
            }
        }
    }

    private findLabel(): HTMLElement | null {
        let parent = this.el.nativeElement.parentElement;
        while (parent) {
            const label = parent.querySelector('label');
            if (label) return label;
            parent = parent.parentElement;
        }
        return null;
    }
}
