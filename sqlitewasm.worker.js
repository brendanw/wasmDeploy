importScripts("sqlite3.js");
console.log("local sqlitewasm worker!");
let db = null;

async function createDatabase() {
   console.log("attempting to create sqlite3 db")
   const sqlite3 = await sqlite3InitModule();

   // TODO: Parameterize storage location, and storage type
   db = new sqlite3.oo1.DB("file:database.db?vfs=opfs", "c");
   console.log("database created successfully.");

   // Uncomment out the below to delete the db
   /*await deleteDatabase();
   console.log("database deleted");*/
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
      const dbFile = await fs.getFileHandle("database.db", {create: false});

      // Delete the file
      await fs.removeEntry("database.db");
      console.log("Database deleted successfully.");

   } catch (err) {
      console.error("Error deleting the database:", err);
   }
}

if (typeof importScripts === "function") {
   console.log('this sqlitewasm.worker..js script is being imported');
   db = null;
   const sqlModuleReady = createDatabase();
   self.onmessage = (event) => {
      return sqlModuleReady.then(handleMessage.bind(event))
         .catch(handleError.bind(event));
   }
}