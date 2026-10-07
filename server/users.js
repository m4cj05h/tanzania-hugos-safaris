import {randomBytes, randomUUID, scrypt, scryptSync, timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';

const scryptAsync=promisify(scrypt);

// What each role may do in the admin. Everyone signed in can see the dashboard and their own account.
export const roles={
  owner:{label:'Owner',permissions:['content','enquiries','comments','users']},
  editor:{label:'Content editor',permissions:['content','comments']},
  sales:{label:'Sales & enquiries',permissions:['enquiries','comments']},
};
export const permissionsOf=role=>roles[role]?.permissions||[];

const cleanUsername=value=>typeof value==='string'?value.trim().toLowerCase():'';
const usernameError=username=>/^[a-z0-9._-]{3,40}$/.test(username)?'':'Usernames need 3 to 40 letters, numbers, dots, dashes or underscores, with no spaces.';
const nameError=name=>typeof name==='string'&&name.trim().length>=1&&name.trim().length<=80?'':'Enter a name of up to 80 characters.';
const passwordError=password=>typeof password==='string'&&password.length>=10&&password.length<=200?'':'Passwords need at least 10 characters.';
const roleError=role=>roles[role]?'':'Choose a role.';

// Admin users, kept in the site database with salted scrypt password hashes.
export function createUsers(db,{seedUsername,seedPassword}={}){
  db.exec('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created TEXT NOT NULL)');
  const hashSync=(password,salt)=>scryptSync(password,Buffer.from(salt,'hex'),64);
  const hashAsync=async(password,salt)=>scryptAsync(password,Buffer.from(salt,'hex'),64);
  const dummySalt=randomBytes(32).toString('hex'),dummyHash=hashSync(randomBytes(16).toString('hex'),dummySalt);

  // The first owner comes from ADMIN_USERNAME / ADMIN_PASSWORD; after that, users are managed in the admin.
  const count=()=>db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if(!count()&&seedPassword){
    const salt=randomBytes(32).toString('hex');
    db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?,?)').run(randomUUID(),cleanUsername(seedUsername)||'admin','Owner','owner',salt,hashSync(seedPassword,salt).toString('hex'),1,new Date().toISOString());
  }

  const publicUser=row=>row&&{id:row.id,username:row.username,name:row.name,role:row.role,roleLabel:roles[row.role]?.label||row.role,permissions:permissionsOf(row.role),active:!!row.active,created:row.created};
  const row=id=>db.prepare('SELECT * FROM users WHERE id=?').get(id);
  const activeOwners=except=>db.prepare('SELECT COUNT(*) AS n FROM users WHERE role=\'owner\' AND active=1 AND id<>?').get(except||'').n;
  const takenBy=(username,except)=>db.prepare('SELECT id FROM users WHERE username=? AND id<>?').get(username,except||'');

  // Always does the slow hash, so a wrong username takes as long as a wrong password.
  async function verify(username,password){
    const found=db.prepare('SELECT * FROM users WHERE username=?').get(cleanUsername(username));
    const candidate=await hashAsync(typeof password==='string'?password:'',found?.salt||dummySalt);
    const ok=timingSafeEqual(candidate,found?Buffer.from(found.hash,'hex'):dummyHash);
    return ok&&found&&found.active&&roles[found.role]?publicUser(found):null;
  }
  async function setPassword(id,password){
    const salt=randomBytes(32).toString('hex');
    db.prepare('UPDATE users SET salt=?,hash=? WHERE id=?').run(salt,(await hashAsync(password,salt)).toString('hex'),id);
  }

  return {
    count,verify,
    get:id=>publicUser(row(id)),
    list:()=>db.prepare('SELECT * FROM users ORDER BY created ASC').all().map(publicUser),
    async create({username,name,role,password}){
      const clean=cleanUsername(username);
      const problem=usernameError(clean)||nameError(name)||roleError(role)||passwordError(password)||(takenBy(clean)?'That username is already taken.':'');
      if(problem)return {error:problem};
      const id=randomUUID();
      db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?,?)').run(id,clean,name.trim(),role,'00','00',1,new Date().toISOString());
      await setPassword(id,password);
      return {user:publicUser(row(id))};
    },
    // Changes any of username, name, role, active and password. Keeps at least one active owner.
    async update(id,changes){
      const current=row(id);
      if(!current)return {error:'User not found.',status:404};
      const next={username:current.username,name:current.name,role:current.role,active:!!current.active};
      if(changes.username!==undefined)next.username=cleanUsername(changes.username);
      if(changes.name!==undefined)next.name=changes.name;
      if(changes.role!==undefined)next.role=changes.role;
      if(changes.active!==undefined)next.active=changes.active===true;
      const problem=usernameError(next.username)||nameError(next.name)||roleError(next.role)
        ||(changes.password!==undefined&&passwordError(changes.password))
        ||(takenBy(next.username,id)?'That username is already taken.':'')
        ||(current.role==='owner'&&current.active&&(next.role!=='owner'||!next.active)&&!activeOwners(id)?'Keep at least one active owner, so someone can always manage users.':'');
      if(problem)return {error:problem};
      db.prepare('UPDATE users SET username=?,name=?,role=?,active=? WHERE id=?').run(next.username,next.name.trim(),next.role,next.active?1:0,id);
      if(changes.password!==undefined)await setPassword(id,changes.password);
      return {user:publicUser(row(id))};
    },
    remove(id){
      const current=row(id);
      if(!current)return {error:'User not found.',status:404};
      if(current.role==='owner'&&current.active&&!activeOwners(id))return {error:'Keep at least one active owner, so someone can always manage users.'};
      db.prepare('DELETE FROM users WHERE id=?').run(id);
      return {ok:true};
    },
  };
}
