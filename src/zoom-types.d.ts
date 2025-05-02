// src/zoom-types.d.ts
declare namespace ZoomMtgEmbedded {
    interface ZoomMtgEmbeddedStatic {
        createClient(): any;
    }
}

declare const ZoomMtgEmbedded: ZoomMtgEmbeddedStatic;

declare namespace ZoomMtg {
    function setZoomJSLib(path: string, dir: string): void;
    function preLoadWasm(): void;
    function prepareWebSDK(): void;
    function i18n(language: string): void;
    function init(options: any): void;
    function join(options: any): void;
    function showInviteFunction(show: boolean): void;
}

declare const ZoomMtg: typeof ZoomMtg;
