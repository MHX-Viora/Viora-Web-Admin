export async function downloadVerificationFile(challengeToken: string): Promise<boolean> {
  if (!/^[A-Za-z0-9_-]+$/.test(challengeToken)) throw new Error('Mã xác minh không hợp lệ. Vui lòng tải lại trang.');
  const url = URL.createObjectURL(new Blob([challengeToken], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ankt-mini-app-verification.txt';
  try {
    document.body.appendChild(link);
    link.click();
    return true;
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
