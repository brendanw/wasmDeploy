!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.common=t():e.common=t()}(globalThis,(()=>(()=>{importScripts("sqlite3.js"),console.log("local sqlitewasm worker!");let e=null;function t(){const t=this.data;switch(t&&t.action){case"exec":if(!t.sql)throw new Error("exec: Missing query string");return postMessage({id:t.id,results:{values:e.exec({sql:t.sql,bind:t.params,returnValue:"resultRows"})}});case"begin_transaction":return postMessage({id:t.id,results:e.exec("BEGIN TRANSACTION;")});case"end_transaction":return postMessage({id:t.id,results:e.exec("END TRANSACTION;")});case"rollback_transaction":return postMessage({id:t.id,results:e.exec("ROLLBACK TRANSACTION;")});case"delete_database":return async function(){try{e&&(e.close(),e=null);const t=await navigator.storage.getDirectory();await t.getFileHandle("database.db",{create:!1}),await t.removeEntry("database.db"),console.log("Database deleted successfully.")}catch(e){console.error("Error deleting the database:",e)}}(t.id);default:throw console.log(`Unsupported action: ${t&&t.action}`),new Error(`Unsupported action: ${t&&t.action}`)}}function s(e){return postMessage({id:this.data.id,error:e})}if("function"==typeof importScripts){console.log("this sqlitewasm.worker..js script is being imported"),e=null;const o=async function(){console.log("attempting to create sqlite3 db");const t=await sqlite3InitModule();e=new t.oo1.DB("file:database.db?vfs=opfs","c"),console.log("database created successfully.")}();self.onmessage=e=>o.then(t.bind(e)).catch(s.bind(e))}return{}})()));
//# sourceMappingURL=94.js.map