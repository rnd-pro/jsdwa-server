import path from 'path';

/**
 * 
 * @param {String} p 
 * @returns 
 */
export default function pth(p) {
  return path.resolve(process.cwd(), p);
}
