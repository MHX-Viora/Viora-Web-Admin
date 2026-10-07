# Withdrawal failure confirmation and QR validation

- Root cause: Failed opened a confirmation dialog with no reason input. The confirm callback silently returned for blank reasons; the only reason textarea was behind the modal.
- Admin: Failed and Rejected dialogs now contain a required reason field and disable confirmation for blank/whitespace reasons or pending requests. Rejection can be opened before entering a reason. Existing submit lock and server error handling remain.
- QR: only render for Processing with a usable recipient; stale QR URLs do not override `canTransfer=false`.
- Backend: recipient account length is now 6–19 digits to match VietQR Quick Link; transfer amount is limited to 13 digits. Unsupported legacy recipients can still fail/reject and refund the original full amount, including fees, once.
- Source: https://www.vietqr.io/danh-sach-api/link-tao-ma-nhanh/
- These checks establish QR format validity; they do not verify that an account exists or belongs to the entered holder. Confirmation in the sending bank application is still required.
- Verification: 16 frontend tests passed, build and lint passed; 42 backend tests passed, one PostgreSQL concurrency test skipped without a dedicated database.
- Browser: Processing with an invalid recipient → Failed dialog → blank reason disables confirmation → entering a reason enables confirmation → request becomes Failed with the reason in its timeline. The actual page uses fixture data; no real withdrawal was changed or bank transfer performed.
