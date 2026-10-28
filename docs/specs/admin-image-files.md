# Admin image files

## Objective and scope
Every image authoring field accepts a file from the admin's computer instead of an image URL. Audit found featured-brand logos, utility banners, system notifications and individual stickers. Sticker-pack thumbnails already support files. Other pages only display images or review submitted content.

## Contract and acceptance
- Add admin-only `POST /api/admin/images`, multipart `file`, returning `{ url }` over the existing storage provider. JPEG/PNG/WebP, nonempty, at most 5 MiB; validate signatures server-side. No remote URL ingestion or new credentials/dependencies.
- Shared accessible file field previews selection and reports invalid type/size. Release object URLs on replacement/unmount. Required images block save when absent; optional notification images can be omitted.
- Upload when saving, then send the resulting HTTPS URL through existing create/update contracts. Preserve current images on edits without a replacement. Errors keep the draft; prevent duplicate submissions.
- Individual stickers use their existing pack-scoped upload endpoint, accept PNG/WebP and no longer expose an editable image URL.

## Plan
1. Backend: tests for validation, authorization and storage failure, then shared upload endpoint/storage adapter. Verify focused dotnet tests.
2. Frontend: shared picker/service, then brands, banners, notifications and stickers. Verify validation tests, browser create/edit/error flows, build and lint.
3. Audit remaining image authoring fields, review diff, record handoff including deploy dependencies.

## Structure and conventions
UI in `src/components`, clients in `src/services`, page-specific tests beside pages. Use existing React state, Axios client and mutation patterns, e.g. `const url = await uploadAdminImage(file)` before saving the existing JSON DTO. Backend uses existing admin role `2`, DI and Cloudinary infrastructure.

## Commands and boundaries
Admin: `npm run build`, `npm run lint`, `node --test --experimental-test-isolation=none src/components/image-file.test.mjs` and browser fixture.
Backend: `dotnet test Viora.Application.Tests --filter FullyQualifiedName~AdminImageUploadTests`.
Always preserve authorization and validate uploads. No schema/auth/CORS changes, production writes or deployment. Mock storage and admin APIs in tests; browser tests must not send real notifications.
