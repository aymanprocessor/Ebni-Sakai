# Add YouTube icon to Scales & Games cards

Goal: Show a small YouTube icon CTA on each scale/game card when a `videoUrl` is provided. The icon opens the YouTube link in a new tab and includes an accessible tooltip via i18n.

Files to change
- `src/app/pages/scales/scales-list.ts` — add `videoUrl?: string` to each scale entry (or update data source used by `SCALES_LIST`).
- `src/app/pages/scales/scales-list/scales-list.component.ts` — update template to render icon link.
- `src/app/pages/games-list/games-list.ts` or `src/assets/games/*.json` — add `videoUrl?: string` to each game entry.
- `src/app/pages/games-list/games-list.component.ts` — update template to render icon link.
- `public/i18n/en-US.json` and `public/i18n/ar-EG.json` — add `"common": { "watchOnYouTube": "Watch on YouTube" }` and Arabic equivalent.
- Optional: add `public/assets/images/youtube.svg` if you prefer not to inline the SVG.

Template snippet (Scales/Games card)

Place the icon inside `.card-inner`, after the title and before the closing element so it aligns to the right using `margin-left: auto`:

```html
<!-- inside card-inner -->
<div class="badge">{{ s.number }}</div>
<h2 class="title">{{ s.title }}</h2>
<a *ngIf="s.videoUrl" [href]="s.videoUrl" class="yt-link" title="{{ 'common.watchOnYouTube' | translate }}" target="_blank" rel="noopener noreferrer" aria-label="{{ 'common.watchOnYouTube' | translate }}">
  <!-- Inline YouTube SVG (24x24) -->
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M23.5 6.2s-.2-1.7-.8-2.5c-.8-1-1.7-1.1-2.1-1.2C16.6 2 12 2 12 2h-.1s-4.6 0-8.6.5c-.5.1-1.3.2-2.1 1.2C.5 4.5.3 6.2.3 6.2S0 8.1 0 10v4c0 1.9.3 3.8.3 3.8s.2 1.7.8 2.5c.8 1 1.9 1 2.4 1.2 1.7.2 7.2.5 8.5.5h.1s4.6 0 8.6-.5c.5-.1 1.3-.2 2.1-1.2.6-.8.8-2.5.8-2.5S24 15.9 24 14v-4c0-1.9-.5-3.8-.5-3.8z" fill="#FF0000"/>
    <path d="M9.5 15.6V8.4L15.8 12l-6.3 3.6z" fill="#fff"/>
  </svg>
</a>
```

CSS snippet (add to the component `styles` array or global stylesheet)

```css
.yt-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  margin-left: auto; /* push to the right in .card-inner */
  text-decoration: none;
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.yt-link:hover { transform: translateY(-2px); }
.yt-link svg { display:block; }
```

i18n
- `public/i18n/en-US.json` add:

```json
{
  "common": {
    "watchOnYouTube": "Watch on YouTube"
  }
}
```

- `public/i18n/ar-EG.json` add:

```json
{
  "common": {
    "watchOnYouTube": "شاهد على يوتيوب"
  }
}
```

Notes & decisions
- I recommend inline SVG for simplicity and to avoid adding an asset; if you prefer a file, add `public/assets/images/youtube.svg` and use `<img>`.
- Keep the link `target="_blank" rel="noopener noreferrer"` for security.
- If the Games component uses a shared card, consider centralizing the icon markup into a small shared component.

Testing
- Add `videoUrl` to one or two items and run the app. Verify icon appears, opens page in new tab, and layout remains good on mobile.

If you'd like, I can implement these changes now (update the data lists, templates, i18n files, and styles). Reply with “apply” and I’ll start editing the files.
