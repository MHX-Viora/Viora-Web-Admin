# Live gifts and SVGA

- `/live-gifts` is linked from the content menu. One searchable/filterable table
  supports create/edit, enable/disable and confirmation-based deletion of unused
  gifts. Used gifts can be disabled; existing backend rejects their deletion.
- One form edits thumbnail, name, integer VND price, order, status and animation.
  Offers Sư tử, Tên lửa, Nụ hôn presets, custom SVGA upload, preserving/removing
  existing effects, and existing procedural effects. New gifts default inactive;
  no price is fabricated. Presets are files to select, not auto-created paid gifts.
- Images use the existing admin image uploader. Multipart gift save carries JSON
  metadata plus optional animation, atomically persisted by the backend. SVGA
  preview uses the self-hosted SVGAPlayer-Web 2.3.1 bundle (Apache-2.0 license
  alongside it). Canvas container must remain positioned; do not constrain its
  width independently because the player scales it to the preview viewport.
- Backend migration `20261029080031_AddGiftSvgaData` adds nullable `AnimationData`
  and `AnimationDurationMs` to the existing LiveGifts table. No extra gift/effects
  table. Deploy backend and apply migration before this admin/client release.
- Admin endpoints: existing GET `/api/live-gifts/admin` and DELETE
  `/api/live-gifts/{id}`; new role-2 POST `/api/live-gifts/admin/upload` and PUT
  `/api/live-gifts/admin/{id}/upload`. Fields: metadata, animation, removeAnimation.
  Existing JSON create/update endpoints remain compatible.
- Animation files are public GET `/api/live-gifts/{id}/animation.svga` (no-store).
  Catalog JSON returns URL/duration, never binary content. Server validates
  SVGA-2 zlib/protobuf metadata, 5 MB compressed/24 MB decompressed, dimensions
  <=4096, <=60 fps and <=30s. Only authorized admin mutations accept uploads.
- Live gift notifications include URL/duration for web/native players in the
  client. Payment code is unchanged. Normal banners/combo handling still operate.
- Verified: admin production build and targeted lint; browser actual page at
  1440/375px, preset upload, required price, default inactive, toggle, edit/custom
  file picker, remove effect, confirm delete, animated preview bounds; backend
  SQLite persistence/validation/admin-role tests; client TS/lint, original assets
  playing sequentially in Chrome. Native WebView is type-checked, not device-tested.
- No migration applied, deployment, real gift creation or payment performed.

Checks: `npm run build`; `node src/pages/live-gifts.browser.mjs`.
Source/player API: https://github.com/svga/SVGAPlayer-Web . Original SVGA files
were supplied by the user; `lion.svga` intentionally retains the requested Sư tử
name despite the original `Fiery-Red-Dragon.svga` filename.
