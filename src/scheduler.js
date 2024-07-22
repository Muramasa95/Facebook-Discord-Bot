import schedule from "node-schedule";
import {
  checkPostDate,
  checkErrorPosts,
  archivePostId,
  storeErrorPostId,
} from "./db.js";
import { sendScheduledPostMsg } from "./discord.js";
import { postImage } from "./fb.js";
import { PostData } from "./postData.js";

let schdeuleIds = [];

async function checkDate() {
  cancelAllPosts();

  checkErrorPosts()
    .then((errRows) => {
      if (!errRows) return;

      console.log(
        `there are ${errRows.length} error posts, moving them to error table.`
      );

      errRows.forEach(async (row) => {
        const postData = new PostData();
        postData.setDBPost(row);

        await storeErrorPostId(postData.id, "time passed in posts table");

        await sendScheduledPostMsg(postData, false);
      });
    })
    .catch((err) =>
      console.error(`Error while retrieving error posts: ${err}`)
    );

  await checkPostDate()
    .then(async (todayPosts) => {
      if (!todayPosts) {
        console.log(`No posts scheduled found for today!`);
        return;
      }

      console.log(`there are ${todayPosts.length} scheduled for today!`);

      await preparePosts(todayPosts);
    })
    .catch((err) =>
      console.error(`Error while retrieving today posts: ${err}`)
    );
}

async function preparePosts(rows) {
  const todayPosts = [];

  // console.log(rows);

  for (const row of rows) {
    //console.log(row);
    const postData = new PostData();
    postData.setDBPost(row);
    todayPosts.push(postData);
  }

  schedulePost(todayPosts);
}

function schedulePost(todayPosts) {
  todayPosts.forEach((post) => {
    console.log(
      `preparing ${post.id} ${post.caption} on [${post.date} ISO:${post.dateISO}] to post!`
    );

    const schdeuleId = schedule.scheduleJob(post.dateISO, () => {
      postToFB(post);
    });

    schdeuleIds.push(schdeuleId);
  });
}

async function postToFB(post) {
  //console.log("Posting to Facebook:", post);

  await postImage(post)
    .then((fbid) => {
      // console.log("the post id is:", fbid);

      if (fbid) {
        sendScheduledPostMsg(post, true);
        archivePostId(post.id, fbid);
      } else {
        sendScheduledPostMsg(post, false);
        storeErrorPostId(post, "error while uploading the post");
      }
    })
    .catch((err) => console.error(`Error while uploading the post: ${err}`));
}

function cancelAllPosts() {
  for (const id in schdeuleIds) {
    if (schdeuleIds[id]) {
      schdeuleIds[id].cancel();
      console.log(`Cancelled job with ID: ${id}`);
    }
  }
  schdeuleIds = [];
}

export { checkDate, preparePosts };
