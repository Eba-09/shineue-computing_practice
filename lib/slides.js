// Turns a Google Slides / Google Drive share link into an embeddable URL.
export function embedUrl(url) {
  if (!url) return null;
  const u = url.trim();
  let m = u.match(/docs\.google\.com\/presentation\/d\/([\w-]+)/);
  if (m) return `https://docs.google.com/presentation/d/${m[1]}/embed?start=false&loop=false`;
  m = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/) || u.match(/drive\.google\.com\/open\?id=([\w-]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  m = u.match(/docs\.google\.com\/(document|spreadsheets)\/d\/([\w-]+)/);
  if (m) return `https://docs.google.com/${m[1]}/d/${m[2]}/preview`;
  return null;
}
