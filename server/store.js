import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {getPartners} from '../src/partners.js';
import {getShowcaseLinks} from '../src/showcase-links.js';
mkdirSync(process.env.DATA_DIR || 'data',{recursive:true});
export const db = new DatabaseSync(`${process.env.DATA_DIR || 'data'}/hugos.sqlite`);
db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS content(id TEXT PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS enquiries(id TEXT PRIMARY KEY, created TEXT NOT NULL, status TEXT NOT NULL, value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS comments(id TEXT PRIMARY KEY, created TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Pending', published INTEGER NOT NULL DEFAULT 0, reply TEXT NOT NULL DEFAULT '', value TEXT NOT NULL);`);
export function getContent(){const content=JSON.parse(db.prepare('SELECT value FROM content WHERE id=?').get('site')?.value || 'null');return content&&{...content,partners:getPartners(content),showcaseLinks:getShowcaseLinks(content)}}
export function saveContent(value){db.prepare('INSERT OR REPLACE INTO content VALUES (?,?)').run('site',JSON.stringify(value))}
