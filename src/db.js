import sqlite3 from "sqlite3";
import { checkDate } from "./scheduler.js";

const db = new sqlite3.Database("./src/db/posts.db");

db.serialize(function () {
  db.run(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date INTEGER,
        dateiso INTEGER,
        user TEXT,
        caption TEXT,
        artist TEXT,
        comment TEXT,
        images TEXT
        );`);
});

db.serialize(function () {
  db.run(`
      CREATE TABLE IF NOT EXISTS archived_posts (
        id INTEGER,
        date INTEGER,
        dateiso INTEGER,
        user TEXT,
        caption TEXT,
        artist TEXT,
        comment TEXT,
        images TEXT,
        fbid TEXT,
        reach INTEGER
        );`);
});

db.serialize(function () {
  db.run(`
      CREATE TABLE IF NOT EXISTS error_posts (
        id INTEGER,
        date INTEGER,
        dateiso INTEGER,
        user TEXT,
        caption TEXT,
        artist TEXT,
        comment TEXT,
        images TEXT,
        errmsg TEXT
        );`);
});

db.serialize(function () {
  db.run(`
      CREATE TABLE IF NOT EXISTS deleted_posts (
        id INTEGER,
        date INTEGER,
        dateiso INTEGER,
        user TEXT,
        caption TEXT,
        artist TEXT,
        comment TEXT,
        images TEXT,
        deleted INTEGER
        );`);
});

// store posts to posts table
function storePost(postData, fbid) {
  const db = new sqlite3.Database("./src/db/posts.db");
  const images = postData.images.join(",\n");

  return new Promise((resolve, reject) => {
    db.serialize(function () {
      db.run(
        `
        INSERT INTO posts (date, dateiso, user, caption, artist, comment, images)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          postData.date,
          postData.dateISO,
          postData.user,
          postData.caption,
          postData.artist,
          postData.comment,
          images,
        ],
        (err) => {
          if (err) {
            console.error("error while inserting data", err);
            reject(err);
          } else {
            // if the process is successful get the newly added post's id
            db.get(
              "SELECT * FROM posts ORDER BY id DESC LIMIT 1", // to get the last added entry
              (err, row) => {
                if (err) {
                  console.error("error while inserting data", err);
                  reject(err);
                } else {
                  db.close();
                  console.log("post stored succssfully!");
                  if (fbid)
                    // check if facebook post id exist, if it does this means the post was posted without scheduling
                    archivePostId(row.id, fbid);
                  else checkDate();
                  resolve(row.id);
                }
              }
            );
          }
        }
      );
    });
  });
}

// archive a post when it is posted already
async function archivePostId(id, fbid) {
  const db = new sqlite3.Database("./src/db/posts.db");

  // console.log(id, fbid);

  db.serialize(function () {
    db.run(
      `
        INSERT INTO archived_posts (id, date, dateiso, user, caption, artist, comment, images)
        SELECT id, date, dateiso, user, caption, artist, comment, images
        FROM posts 
        WHERE id = ?`,
      [id],
      (err) => {
        if (err) {
          console.error("ERROR while inserting,", err);
        } else {
          console.log("post moved from posts to archives succssfully!");
        }
      }
    );
  });

  db.serialize(function () {
    db.run("DELETE FROM posts WHERE id = ?", id);
  });

  db.serialize(function () {
    db.run(
      `UPDATE archived_posts
        SET fbid = ?
        WHERE id = ?`,
      [fbid, id],
      function (err) {
        if (err) {
          console.error(err.message);
        } else {
          console.log(`fbid added successfully`);
          db.close();
        }
      }
    );
  });
}

// archive a post that wasn't made due to any error
async function storeErrorPostId(id, errmsg) {
  const db = new sqlite3.Database("./src/db/posts.db");

  db.serialize(function () {
    db.run(
      `
        INSERT INTO error_posts (id, date, dateiso, user, caption, artist, comment, images)
        SELECT id, date, dateiso, user, caption, artist, comment, images FROM posts
        WHERE id = ?;`,
      [id],
      (err) => {
        if (err) {
          console.error("error while inserting errorPost,", err);
        } else {
          console.log(
            `successfully copied entry no.${id} from posts table to error_posts table`
          );
        }
      }
    );

    db.run("DELETE FROM posts WHERE id = ?", id, (err) => {
      if (err) {
        console.error("error while deleting entry from posts table,", err);
      } else {
        console.log(`deleted entry ${id} from posts table!`);
      }
    });

    db.run(
      `UPDATE error_posts SET errmsg = ? WHERE id = ?;`,
      [errmsg, id],
      (err) => {
        if (err) {
          console.error("error while inserting errmsg entry to ,", err);
        } else {
          console.log(`successfully inserted errmsg into entry no.${id}`);
        }
      }
    );

    db.close();
  });
}

// deleted posts are stored here
async function storeDeletedPosts(id) {
  const db = new sqlite3.Database("./src/db/posts.db");
  const DeletionDate = new Date().toLocaleString();

  db.serialize(function () {
    db.run(
      `
        INSERT INTO deleted_posts (id, date, dateiso, user, caption, artist, comment, images)
        SELECT id, date, dateiso, user, caption, artist, comment, images FROM posts
        WHERE id = ?;`,
      [id],
      (err) => {
        if (err) {
          console.error("error while inserting deleted post,", err);
        } else {
          console.log(
            `successfully copied entry no.${id} from posts table to deleted_posts table`
          );
        }
      }
    );

    db.run("DELETE FROM posts WHERE id = ?", id, (err) => {
      if (err) {
        console.error("error while deleting entry from posts table,", err);
      } else {
        console.log(`deleted entry ${id} from posts table!`);
      }
    });

    db.run(
      `UPDATE deleted_posts SET deleted = ? WHERE id = ?;`,
      [DeletionDate, id],
      (err) => {
        if (err) {
          console.error(
            `error while inserting deletion date to entry no.${id} due to an error: ${err}`
          );
        } else {
          console.log(
            `successfully inserted deletion date into entry no.${id}`
          );
        }
      }
    );

    db.close();
  });
}

// check for posts scheduled for today
function checkPostDate() {
  const db = new sqlite3.Database("./src/db/posts.db");

  return new Promise((resolve, reject) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // console.log(today, tomorrow);
    // console.log(today.toISOString(), tomorrow.toISOString());
    // console.log(today.toLocaleString(), tomorrow.toLocaleString());

    db.all(
      `
    SELECT * FROM posts WHERE dateiso > ? AND dateiso < ? ORDER BY dateiso ASC
  `,
      [today.toISOString(), tomorrow.toISOString()],
      (err, rows) => {
        if (err) {
          console.error(`Error while retrieving posts: ${err}`);
          reject(err);
        }
        if (rows.length > 0) {
          resolve(rows);
        } else {
          resolve();
        }
      }
    );
  });
}

// check posts that its time passed for posting
async function checkErrorPosts() {
  const db = new sqlite3.Database("./src/db/posts.db");

  return new Promise((resolve, reject) => {
    const now = new Date();

    // console.log(now.toISOString());
    // console.log(now.toLocaleString());

    db.all(
      `
    SELECT * FROM posts WHERE dateiso < ? 
  `,
      [now.toISOString()],
      (err, rows) => {
        if (err) {
          reject(err);
        }

        if (rows.length > 0) {
          // console.log(rows);
          resolve(rows);
        } else {
          console.log(`no error posts found!`);
          resolve();
        }
      }
    );
  });
}

// edit data
function editData(newData) {
  const db = new sqlite3.Database("./src/db/posts.db");
  const idNew = newData[0].value;

  return new Promise((resolve, reject) => {
    for (const i of newData) {
      if (!i.value || i.col === "id") continue;

      if (i.col === "images") {
        // for editing images only
        const images = i.value.join(",\n");
        db.run(
          `UPDATE posts
          SET images = ?
          WHERE id = ?`,
          [images, idNew],
          function (err) {
            if (err) {
              console.error(err.message);
              reject(err);
            } else {
              console.log(`edited images in post no.${idNew} successfully`);
            }
          }
        );
      } else {
        // for editing anything else
        db.run(
          `UPDATE posts
        SET ${i.col} = ?
        WHERE id = ?`,
          [i.value, idNew],
          function (err) {
            if (err) {
              console.error(err.message);
              reject(err);
            } else {
              console.log(`edited ${i.col} in post no.${idNew} successfully`);
            }
          }
        );
      }
    }
    db.close();
    resolve();
  });
}

// delete a post
function delPost(id) {
  const db = new sqlite3.Database("./src/db/posts.db");

  return new Promise((resolve, reject) => {
    db.serialize(function () {
      db.all("DELETE FROM posts WHERE id = ?", [id], (err) => {
        db.close();
        if (err) {
          console.error("error while getting entry,", err);
          reject(err);
        } else {
          console.log(`Successfully deleted entry no.${id}`);
          resolve(true);
        }
      });
    });
  });
}

// get a single entry
function getEntry(id) {
  const db = new sqlite3.Database("./src/db/posts.db");
  const tables = ["posts", "archived_posts", "error_posts", "deleted_posts"];

  return new Promise((resolve, reject) => {
    const searchTable = (index) => {
      if (index >= tables.length) {
        db.close();
        reject("noID");
        return;
      }

      const table = tables[index];
      db.get(`SELECT * FROM ${table} WHERE id = ?`, [id], (err, row) => {
        if (err) {
          console.error("error while listing entries,", err);
          db.close();
          reject(err);
        } else if (row) {
          db.close();
          resolve(row);
        } else {
          searchTable(index + 1);
        }
      });
    };

    searchTable(0);
  });
}

// list posts that are scheduled from tomorrow and onwards
function listEntries() {
  const db = new sqlite3.Database("./src/db/posts.db");

  return new Promise((resolve, reject) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    console.log(tomorrow.toLocaleString());

    db.serialize(function () {
      db.all(
        "SELECT * FROM posts WHERE dateiso >= ? ORDER BY dateiso ASC LIMIT ?",
        [tomorrow.toISOString(), 20],
        (err, rows) => {
          db.close();

          if (err) {
            console.error("error while listing entries,", err);
            reject(err);
          } else {
            console.log("successfully retrieved rows.");
            resolve(rows);
          }
        }
      );
    });
  });
}

// list archived posts, this function has a variable called count that decides how many items to get, max is 20, it is also sorted ascedningly to get the last added items
function listArchivedEntries(count) {
  const db = new sqlite3.Database("./src/db/posts.db");
  if (!count) count = 5;

  if (count > 20) count = 20;

  return new Promise((resolve, reject) => {
    db.serialize(function () {
      db.all(
        "SELECT * FROM archived_posts ORDER BY rowid DESC LIMIT ?",
        [count],
        (err, rows) => {
          db.close();

          if (err) {
            console.error("error while listing archived entries,", err);
            reject(err);
          } else {
            console.error("successfully got entries from archived posts");
            resolve(rows);
          }
        }
      );
    });
  });
}

// list error posts, works like the previous funtion
function listErrorEntries(count) {
  const db = new sqlite3.Database("./src/db/posts.db");
  if (!count) count = 5;

  if (count > 20) count = 20;

  return new Promise((resolve, reject) => {
    db.serialize(function () {
      db.all(
        "SELECT * FROM error_posts ORDER BY rowid DESC LIMIT ?;",
        [count],
        (err, rows) => {
          db.close();

          if (err) {
            console.error("error while listing error entries,", err);
            reject(err);
          } else {
            console.log("Succssfully got entries from error_posts table");
            resolve(rows);
          }
        }
      );
    });
  });
}

// list deleted posts, works like the 2 previous funtion
function listDeletedEntries(count) {
  const db = new sqlite3.Database("./src/db/posts.db");
  if (!count) count = 5;

  if (count > 20) count = 20;

  return new Promise((resolve, reject) => {
    db.serialize(function () {
      db.all(
        "SELECT * FROM deleted_posts ORDER BY rowid DESC LIMIT ?;",
        [count],
        (err, rows) => {
          db.close();

          if (err) {
            console.error("error while listing deleted entries,", err);
            reject(err);
          } else {
            console.log("Succssfully got entries from deleted_posts table");
            resolve(rows);
          }
        }
      );
    });
  });
}

export {
  storePost,
  checkPostDate,
  checkErrorPosts,
  archivePostId,
  storeErrorPostId,
  editData,
  delPost,
  getEntry,
  listEntries,
  listArchivedEntries,
  listErrorEntries,
  storeDeletedPosts,
  listDeletedEntries,
};
