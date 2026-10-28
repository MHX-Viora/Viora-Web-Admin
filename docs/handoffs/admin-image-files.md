# Admin image files — 2026-10-28

- Audited editable image fields across `src/pages` and `src/components`. Converted featured-brand logo, utility-banner image, notification image and individual sticker image from URL authoring to local file selection. Sticker-pack thumbnails already use local files. Remaining image references are display/review data.
- Shared `ImageFileField`: local preview, selected filename, remove pending selection, preserve existing image, MIME/5 MiB checks, accessible label/error, object URL cleanup. Brand/banner uploads occur during save; failed record saves retain the uploaded URL for retry. Notification image remains optional. Sticker uses existing pack-scoped upload; creation is disabled without a name/file and errors retain the draft.
- Added `POST /api/admin/images` in BE, multipart `file` -> `{ url }`. Role `2` required; owner from existing `user_id` claim. Reuses signature validator and existing Cloudinary storage config, separate `viora/admin/{id}/images` folder. JPEG/PNG/WebP, nonempty, <=5 MiB, bounded request size. Storage errors return sanitized 503. No schema, CORS, auth, secrets or dependency changes.
- Checks: image validation unit test; BE `AdminImageUploadTests` (8 cases); brand/banner browser create/edit/toggle/delete; notification optional-image/invalid-file/upload-failure/retry/remove; sticker file upload/create; responsive 375/1440 checks and notification screenshots. All browser APIs/storage are synthetic; no live notification/upload was sent. Admin production build and full lint pass. Build has existing >500 kB chunk advisory.
- Deploy BE first, then admin; endpoint is required by the three general-image forms. Existing create/update JSON DTOs remain unchanged. No deployment or commits performed. Existing images are retained until the admin selects a replacement. Stored files uploaded before a cancelled/failed record save follow the provider's existing lifecycle; no new deletion lifecycle added here.

Commands (admin cwd):
`node --test --experimental-test-isolation=none src/components/image-file.test.mjs`
`node src/pages/featured-brands.browser.mjs`
`node src/pages/utility-banners.browser.mjs`
`node src/pages/admin-image-files.browser.mjs`
`npm run build` / `npm run lint`

BE cwd: `dotnet test Viora.Application.Tests --no-restore --filter FullyQualifiedName~AdminImageUploadTests -m:1 -nr:false /p:UseSharedCompilation=false`

## Follow-up: production upload failures and optional brand names
- Live anonymous POST probe to `/api/admin/images` returned empty 404 on both `api.mxh.ankt.vn` and the legacy Render host. Admin has shipped ahead of BE; deploy the upload endpoint/DI/storage changes before expecting successful image saves. No production deployment performed here.
- Empty error strings previously produced an empty toast. `getErrorMessage` now ignores blank values, reads validation ProblemDetails and supplies status-specific fallbacks; upload 404 explicitly says the backend endpoint needs deployment, and 413 explains image/proxy limits. Applies across all admin forms.
- File input now retains its native selected filename after selection and clears when pending selection is removed or a draft completes. No change to preview URL lifecycle.
- Brand name is optional in admin and BE request validation. Missing/null/blank names normalize to `Thương hiệu` so existing DB/public-client contracts and accessible logo names remain valid; no schema or public-client changes needed. The 160-character limit remains.
- Regression verification: 18 BE tests (brand validation/persistence, real HTTP omitted-name create, upload); frontend image/error unit tests; browser brand creation without name, banner create/edit, notification empty-404/retry, native filename/reset and sticker creation. Build and full lint checked. Latest changes are local and not committed/deployed.

## Follow-up: rejected replacements and malformed responses
- Reproduced an invalid replacement leaving the previous pending image in React state while the native input was empty; optional-image forms were still valid. Rejection now clears the pending file and sets native custom validity. Selecting a valid image or discarding the invalid selection restores validity; saved existing images remain available. Sticker creation is also disabled when a rejected replacement clears its file.
- Upload responses are treated as unknown data. Missing/malformed URLs, HTML fallback responses, credentials, non-HTTPS schemes, whitespace/control characters and backslashes are rejected with a readable message instead of raw TypeError/Invalid URL errors.
- Browser regression verifies valid -> invalid -> valid replacement, form blocking and preview URL cleanup, then upload 404/retry and successful notification/sticker creation. No live data writes.
- Final admin verification: all 45 unit tests, production build, full ESLint and all three image browser fixtures pass.
