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
