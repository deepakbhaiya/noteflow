/**
 * Small, dependency-free unique id generator (RFC4122-ish, good enough for
 * local primary keys).
 */
export function uid(): string {
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 32; i++) {
    out += hex[Math.floor(Math.random() * 16)];
  }
  return `${out.slice(0, 8)}-${out.slice(8, 12)}-4${out.slice(13, 16)}-a${out.slice(17, 20)}-${out.slice(20, 32)}`;
}
