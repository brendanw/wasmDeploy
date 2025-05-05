importScripts("sqlite3.js");
let db = null;

//TODO: https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker
// use a SharedWorker so we can have concurrent db access from multiple tabs
async function createDatabase() {
   const sqlite3 = await sqlite3InitModule();

   // TODO: Parameterize storage location, and storage type
   db = new sqlite3.oo1.DB("file:database.db?vfs=opfs", "c");
}

function handleMessage() {
   const data = this.data;

   switch (data && data.action) {
      case "exec":
         if (!data["sql"]) {
            throw new Error("exec: Missing query string");
         }

         return postMessage({
            id: data.id,
            results: {values: db.exec({sql: data.sql, bind: data.params, returnValue: "resultRows"})},
         })
      case "begin_transaction":
         return postMessage({
            id: data.id,
            results: db.exec("BEGIN TRANSACTION;"),
         })
      case "end_transaction":
         return postMessage({
            id: data.id,
            results: db.exec("END TRANSACTION;"),
         })
      case "rollback_transaction":
         return postMessage({
            id: data.id,
            results: db.exec("ROLLBACK TRANSACTION;"),
         })
      case "delete_database":
         return deleteDatabase(data.id);
      default:
         console.log(`Unsupported action: ${data && data.action}`)
         throw new Error(`Unsupported action: ${data && data.action}`);
   }
}

function handleError(err) {
   if (error.message?.includes("no such column") === true) {
      deleteDatabase();
      window.location.replace("https://www.basebeta.com");
      return;
   }

   return postMessage({
      id: this.data.id,
      error: err,
   });
}

async function deleteDatabase() {
   try {
      if (db) {
         db.close(); // Close the database connection
         db = null;
      }

      // Check if the database is stored in OPFS
      const fs = await navigator.storage.getDirectory();

      // Delete the file
      await fs.removeEntry("database.db");
   } catch (err) {
      console.error("Error deleting the database:", err);
   }
}

if (typeof importScripts === "function") {
   db = null;
   const sqlModuleReady = createDatabase();
   self.onmessage = (event) => {
      return sqlModuleReady.then(handleMessage.bind(event))
         .catch(handleError.bind(event));
   }
}