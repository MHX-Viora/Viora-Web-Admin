# Live gift management

One admin table at `/live-gifts`: list/search, add/edit, enable/disable and delete
unused gifts. The same form edits name, thumbnail, VND price, sort order and SVGA
animation. Offer Sư tử, Tên lửa and Nụ hôn presets or a new SVGA upload, with
animated preview. Price is mandatory; no fabricated prices or automatic sales.

Store SVGA bytes and measured duration in the existing LiveGifts table, with
admin-only multipart mutations. Existing JSON APIs/gifts remain compatible.
Validate SVGA 2 compression/protobuf metadata and bounded size/duration. Public
animation responses omit bytes from catalog JSON. Broadcast animation metadata
to hosts/viewers and play through a bounded overlay queue, preserving payment,
banner and existing procedural effects. No separate effects management table.

Tasks: validate/persist uploads + migration/tests; admin CRUD/form/preview;
client SVGA playback web/native and realtime queue; mocked browser checks,
backend tests, builds/type checks/lint. Document migration/deployment requirements.
