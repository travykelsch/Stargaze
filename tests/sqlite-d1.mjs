export function sqliteD1(sqlite){return {
 async batch(statements){sqlite.exec('BEGIN');try{const results=statements.map(s=>s._execute());sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}},
 prepare(sql){const bound=args=>{
  const execute=()=>/^\s*(SELECT|PRAGMA|WITH)\b/i.test(sql)?{results:sqlite.prepare(sql).all(...args),meta:{changes:0}}:{results:[],meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}};
  return {_execute:execute,async first(){return sqlite.prepare(sql).get(...args)||null;},async all(){return {results:sqlite.prepare(sql).all(...args)};},async run(){return execute();}};
 };return {...bound([]),bind(...args){return bound(args);}};}
};}
