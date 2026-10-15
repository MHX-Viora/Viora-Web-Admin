export async function downloadVerificationFile(challengeToken: string, fileName = 'ankt-mini-app-verification.txt', fileContent = challengeToken): Promise<boolean> {
  if (!/^[A-Za-z0-9_-]+$/.test(challengeToken)) throw new Error('Mã xác minh không hợp lệ. Vui lòng tải lại trang.');
  if (!/^ankt-(?:mini-app-verification|verify-[a-f0-9]{32})\.txt$/.test(fileName)) throw new Error('Tên file xác minh không hợp lệ.');
  const url = URL.createObjectURL(new Blob([fileContent], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  try {
    document.body.appendChild(link);
    link.click();
    return true;
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
