import { Client, Routes, ActionRowBuilder, EmbedBuilder } from "discord.js";
import { REST } from "@discordjs/rest";
import { config } from "dotenv";
import { commands, confirmBtns, imgsBtns, postBtns } from "./commands.js";
import { uploadImg } from "./imgbb.js";
import { PostData } from "./postData.js";
import { embedMsg } from "./embedMsg.js";
import { postImage } from "./fb.js";
import { getTweetImage } from "./sites/twitter.js";
import { getPixivImage } from "./sites/pixiv.js";
import { getArtstationImage } from "./sites/artstation.js";
import { getDeviantImage } from "./sites/deviant.js";
import { getTumblrImage } from "./sites/tumblr.js";
import {
  storePost,
  listEntries,
  listArchivedEntries,
  listErrorEntries,
  storeDeletedPosts,
  delPost,
  editData,
  getEntry,
  storeErrorPostId,
  checkPostDate,
  listDeletedEntries,
} from "./db.js";
import { checkDate } from "./scheduler.js";

config();

const client = new Client({ intents: [34305] });
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const NOTIFICATION_CHANNEL = process.env.NOTIFICATION_CHANNEL;
const rest = new REST({ version: "10" }).setToken(TOKEN);
const prefix = "##";
let updatedEmbed = "";

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  await interaction.reply({ content: "Processing..." });

  const command = interaction.commandName;

  // cretes a new object with basic discord info such as username and channel
  const postDataCmd = new PostData();
  postDataCmd.setDiscordData(interaction.user);
  postDataCmd.setSlash(interaction);

  const count = interaction.options.get("count")?.value; // used in some commands
  const id = interaction.options.get("post-id")?.value; // used in some commands

  switch (command) {
    // lists bot commmands as well as its usability
    case "help":
      interaction.editReply({
        content: `
  This is a bot that can take pictures from the user then post them on FB. It can also schedule them to be posted later on.
  There are several slash command such as this one that sends this message, aside from this one the others are:-\n
  * /picture attach-image 
  * /link attach-link 
  * /list-scheduled-posts 
  * /list-today-scheduled-posts 
  * /delete-scheduled-post\n
  Note: There is also a command that is called ping, just ignore it as if it wasn't there :blush:.
  There are also 2 text commands, text commands are not that effiecient or applicant as slash commands.
  Their one advantage is posting multiple images and it is the only case the it us recommended to be used at; other than this case, it is recommended to use slash commands.
  The component of a post are:-\n
  * image: An image that can be attached or taken from a link. This is required in all cases to make a post.
  * caption: typically a name or description of the image. This is the first line of the post, Optional.
  * artist: The creator of the art or the image, it is preceeded with "by". This is the second line of the post. Optional.
  * comment: The source of the image. Will be posted as a comment to the post. Optional.
  * date: The date of which the post will be made. It should be written with this format [ yyyy/mm/dd hh/mm am-pm ]. can take both 24-hour or 12-hour format. e.g. [ 2023/03/28 15:45 ]. Optional, however, if it was empty the post will be made immeditely. You can also add seconds if you want.
    `,
      });
      interaction.channel.send({
        content: `
  To post a regular image use the slash command [ /picture attach-image ]. The only required thing here is an image, the others caption, artist, comment and date are optional.
  To post an image that is inside a link use the slash command [ /link attach-link ]. The only required thing here is the link. like the previous one;  caption, artist and date. Comment is not inputted here, but it is taken directly from the link. This is mostly not working due to hosting issues, only links from "pixiv" is working.
  [ /list-scheduled-posts ] Use this to list scheduled posts regardless of the date as an embed message, takes optional input post-count to see how many posts to get, the default is 5. 
  [ /list-today-scheduled-posts ] Use this to list posts schdeuled to be posted today as an embed message.
  [ /delete-scheduled-post ] Use this to delete a schdeuled post, if you use one of the previous 2 commands you can see posts id, you can input this id to this command to delete the post.
  To see the text commands send this message [##help].
  
  Notes:-
  * So far it is only possible to post images less than 10 MBs, that is because FB API doesn't allow uploading more than this. If you upload an image larger than 10 MB the bot will notify you and cancel the process.
  `,
      });
      break;

    case "picture":
      if (interaction.options.get("image_url").attachment.size > 10000000) {
        interaction.editReply({
          content:
            "The image you attached is larger than 10 MBs, give me smth less than 10 MBs.",
        });
        return;
      }
      const tempImg = [
        { no: 1, url: interaction.options.get("image_url").attachment.url },
      ];

      await uploadImg(tempImg, postDataCmd.caption, false)
        .then((img) => {
          postDataCmd.images = img;
          postDataCmd.setComment(interaction.options.get("source")?.value);
          postConfirmation(postDataCmd, interaction);
        })
        .catch((err) => {
          interaction.editReply({
            content: `error encountered while trying to upload the image: ${err}`,
          });
        });

      break;

    case "link":
      postDataCmd.setComment(interaction.options.get("image_url")?.value);

      if (
        postDataCmd.comment.includes("twitter") ||
        postDataCmd.comment.includes("x.com")
      ) {
        postDataCmd.images = await getTweetImage(postDataCmd.comment);
      } else if (postDataCmd.comment.includes("pixiv")) {
        const tempPixiv = await getPixivImage(
          postDataCmd.comment,
          postDataCmd.caption,
          postDataCmd.artist
        );
        postDataCmd.images = tempPixiv.imgs;
        postDataCmd.artist = tempPixiv.artist;
      } else if (postDataCmd.comment.includes("tumblr")) {
        postDataCmd.images = null; // await getTumblrImage(postDataCmd.comment);
      } else if (postDataCmd.comment.includes("artstation")) {
        postDataCmd.images = null; //await getArtstationImage(postDataCmd.comment);
      } else if (postDataCmd.comment.includes("deviantart")) {
        postDataCmd.images = null; // await getDeviantImage(postDataCmd.comment);
      }

      console.log(postDataCmd.images);

      if (postDataCmd.images === "size") {
        interaction.editReply({
          content:
            "The image or one of the image from this link is larger than 10 MBs.",
        });
        return;
      } else if (!postDataCmd.images) {
        interaction.editReply({
          content: "Cannot get pictures from this link.",
        });
        return;
      }

      postConfirmation(postDataCmd, interaction);
      break;

    // deletes entry with an id as an input
    case "delete-scheduled-post":
      getPost(id, postDataCmd, interaction)
        .then(async (post) => {
          if (post.embeds === "noID")
            interaction.editReply({
              content: `No post found with this ID ${id}`,
            });

          confirmDelete(post, interaction);
        })
        .catch((err) => {
          console.error(`error while trying to delete entry no.${id}: ${err}`);
          interaction.editReply(
            `Couldn't delete post entry no.${id} due to an error: ${err}`
          );
        });
      checkDate();
      break;

    // lists entries that are scheduled from tomorrow onward
    case "list-scheduled-posts":
      listEntries()
        .then(async (rows) => {
          // this checks if there is any data from db
          if (!rows.length) {
            console.log("rows are empty");
            await interaction.editReply({
              content: `No data found!`,
            });
            return;
          }

          DBPostEmbed(rows, postDataCmd, interaction, "");
        })
        .catch((err) => {
          console.error(`error while trying to list scheduled entries: ${err}`);
          interaction.editReply(
            `Couldn't retrieve posts due to an error: ${err}`
          );
        });
      break;

    // lists the posts scheduled today, specifically in the json file
    case "list-today-scheduled-posts":
      await checkPostDate()
        .then(async (rows) => {
          // this checks if there is any data from db
          if (!rows.length) {
            console.log("rows are empty");
            await interaction.editReply({
              content: `No data found!`,
            });
            return;
          }

          DBPostEmbed(rows, postDataCmd, interaction, "");
        })
        .catch((err) => {
          console.error(
            `error while trying to list today scheduled entries: ${err}`
          );
          interaction.editReply(
            `Couldn't retrieve entries due to an error: ${err}`
          );
        });
      break;

    // this lists posts that was posted and archived
    case "list-archived-posts":
      listArchivedEntries(count)
        .then(async (rows) => {
          // this checks if there is any data from db
          if (!rows.length) {
            console.log("rows are empty");
            await interaction.editReply({
              content: `No data found!`,
            });
            return;
          }

          DBPostEmbed(rows, postDataCmd, interaction, "archived");
        })
        .catch((err) => {
          console.error(`error while trying to list archived entries: ${err}`);
          interaction.editReply(
            `Couldn't retrieve entries due to an error: ${err}`
          );
        });
      break;

    // this lists error posts that was not posted for any reason
    case "list-error-posts":
      listErrorEntries(count)
        .then(async (rows) => {
          // this checks if there is any data from db
          if (!rows.length) {
            console.log("rows are empty");
            await interaction.editReply({
              content: `No data found!`,
            });
            return;
          }

          DBPostEmbed(rows, postDataCmd, interaction, "error");
        })
        .catch((err) => {
          console.error(`error while trying to list error entries: ${err}`);
          interaction.editReply(
            `Couldn't retrieve entries due to an error: ${err}`
          );
        });
      break;

    // this lists deleted posts that got deleted
    case "list-deleted-posts":
      listDeletedEntries(count)
        .then(async (rows) => {
          // this checks if there is any data from db
          if (!rows.length) {
            console.log("rows are empty");
            await interaction.editReply({
              content: `No data found!`,
            });
            return;
          }

          DBPostEmbed(rows, postDataCmd, interaction, "deleted");
        })
        .catch((err) => {
          console.error(`error while trying to list deleted entries: ${err}`);
          interaction.editReply(
            `Couldn't retrieve entries due to an error: ${err}`
          );
        });
      break;

    // lists scheduled posts with no embeds
    case "list-scheduled-posts-minimal":
      listEntries()
        .then(async (rows) => {
          // this checks if there is any data from db
          if (!rows.length) {
            console.log("rows are empty");
            await interaction.editReply({
              content: `No data found!`,
            });
            return;
          }

          await interaction.editReply({
            content: `Here are ${rows.length} scheduled posts:-`,
          });
          let minimalPosts = "";

          for (let i = 0; i < rows.length; i++) {
            const n = i + 1;
            const dateLocale = new Date(rows[i].date).toLocaleString();

            minimalPosts += `${n}- ${dateLocale} ID: ${rows[i].id} | ${rows[i].caption} by ${rows[i].artist} | ${rows[i].user}\n`;
          }

          await interaction.channel.send({
            content: minimalPosts,
          });
        })
        .catch((err) => {
          console.error(`error while trying to list scheduled entries: ${err}`);
          interaction.editReply(
            `Couldn't retrieve posts due to an error: ${err}`
          );
        });
      break;

    // lists posts from json file with no embeds
    case "list-today-posts-minimal":
      await checkPostDate()
        .then(async (rows) => {
          if (!rows) {
            console.log("rows are empty");
            await interaction.editReply({
              content: `No data found!`,
            });
            return;
          }

          await interaction.editReply({
            content: `Here are ${rows.length} today posts:-`,
          });
          let minimalPosts = "";

          for (let i = 0; i < rows.length; i++) {
            const n = i + 1;
            const dateLocale = new Date(rows[i].date).toLocaleString();

            minimalPosts += `${n}- ${dateLocale} ID: ${rows[i].id} | ${rows[i].caption} by ${rows[i].artist} | ${rows[i].user}\n`;
          }

          await interaction.channel.send({
            content: minimalPosts,
          });
        })
        .catch((err) => {
          console.error(`error while trying to list scheduled entries: ${err}`);
          interaction.editReply(
            `Couldn't retrieve posts due to an error: ${err}`
          );
        });
      break;

    // this gets a single entry with its id
    case "get-post":
      getPost(id, postDataCmd, interaction)
        .then(async (post) => {
          await interaction.editReply({
            content: `Here is the post you requested:-`,
            embeds: [post.embeds],
          });
        })
        .catch((err) => {
          if (err === "noID") {
            console.log(`Post no.${id} doesn't exist!`);
            interaction.editReply({
              content: `Post no.${id} doesn't exist!`,
            });
          } else {
            console.error(`error while trying to get an entry: ${err}`);
            interaction.editReply({
              content: `Couldn't retrieve the entry due to an error: ${err}`,
            });
          }
        });

      break;

    // edit an already existing post in posts table
    case "edit-post-details":
      const tempImg2 = [
        { no: 1, url: interaction.options.get("image_url")?.attachment.url },
      ];
      let newImg = "";
      let rowDate;

      const row = await getEntry(id);
      rowDate = row.date;

      if (tempImg2[0].url) {
        console.log("uploading new image");
        newImg = await uploadImg(tempImg2, "Edited", false);
      }

      postDataCmd.setEditCmd(interaction, newImg, rowDate);

      try {
        await editData(postDataCmd.arr).then(() => {
          interaction.editReply({
            content: `Successfully edited post no.${postDataCmd.arr[0].value}!`,
          });
        });
      } catch (err) {
        console.error(
          `error while trying to edit post no.${postDataCmd.arr[0].value} due to error: ${err}`
        );
        interaction.editReply({
          content: `Couldn't do task due to an error: ${err}`,
        });
      }

      checkDate();
      break;

    // refreshes json file used by admin only.
    case "refresh-today-posts":
      try {
        interaction.editReply({
          content: `Successfully refreshed!`,
        });
        checkDate();
      } catch (err) {
        console.error(`error while trying to refresh json file: ${err}`);
        interaction.editReply({
          content: `Couldn't do task due to an error: ${err}`,
        });
      }

      break;
  }
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot || !msg.content.startsWith(prefix)) return;

  const postDataMsg = new PostData();
  postDataMsg.setDiscordData(msg.author, msg);

  const botMsg = await msg.channel.send("Processing...");

  if (msg.content.startsWith("##post-image")) {
    if (!msg.attachments) {
      await botMsg.edit("no picturers found!");
      console.log("no attachment found");
      return;
    }
    if (!msg.content.includes("caption", "artist", "source", "time", "date")) {
      botMsg.edit(
        `
The command format of your post details is incorrect. it should be like this:-
        [ ##post-image caption: , artist: , source: , time: , date: ].\n
You can leave what's after the ':' empty if you want, but you still have to type 'caption', 'artist', 'source', 'date'.
Here is a sample, keep your eye on the spaces and commas.\n
        [ ##post-image caption: Bloodborne, artist: me, source: twitter.com, time: 15:16, date: 2023/01/23 ].\n
For more information try the help slash command.
        `
      );
      return;
    }
    const imageAttach = msg.attachments;

    if (imageAttach.size === 0) {
      await botMsg.edit(
        "no image attachements found, you have to attach at least one image."
      );
      return;
    }

    const attachementsSize = [...imageAttach.values()][0].size;

    // console.log("the size of the image attachment", attachementsSize);

    if (attachementsSize > 10000000) {
      await botMsg.edit(
        "the image or one of the images is larger than 10 MBs."
      );
      return;
    }

    const cleanCMD = msg.content.split("post-image")[1];
    postDataMsg.setMsg(cleanCMD);

    const imgURLs = [];
    let n = 1;
    imageAttach.forEach((attach) => {
      // console.log(element.url);
      imgURLs.push({ no: n++, url: attach.url });
    });

    console.log(imgURLs);

    postDataMsg.images = await uploadImg(
      imgURLs,
      postDataMsg.caption,
      false
    ).catch(
      async (err) =>
        await botMsg.edit(`Error while uploading your images: ${err}`)
    );

    postConfirmation(postDataMsg, botMsg);
  } else if (msg.content.startsWith("##help")) {
    botMsg.edit(
      `
There is only one text command so far and that is [ ##post-image ], and here is how to use it:-\n
            [ ##post-image caption: , artist: , source: , time: , date: ].\n
You can leave what's after the ':' empty if you want, but you still have to type 'caption', 'artist', 'source', 'time', 'date'.
Here is a sample, keep your eye on the spaces and commas.\n
            [ ##post-image caption: Bloodborne, artist: me, source: twitter.com, time: 15:16, date: 2023/01/23 ].\n
For more information try the help slash command.
      `
    );
  } else botMsg.edit("No command found, try using help slash command.");
});

async function postConfirmation(postData, interaction) {
  console.log("This is your post:", postData);

  const embedsMsg = new embedMsg(postData);
  const embeds = embedsMsg.regularPost(postData, 0);
  let btns, response, btnInteraction;

  if (postData.images.length > 1) {
    const tempBtns = imgsBtns.concat(confirmBtns);
    btns = new ActionRowBuilder().addComponents(tempBtns);
  } else btns = new ActionRowBuilder().addComponents(confirmBtns);

  if (!interaction.isChatInputCommand) {
    response = await interaction.edit({
      content: " ",
      embeds: [embeds],
      components: [btns],
    });
  } else {
    response = await interaction.editReply({
      content: " ",
      embeds: [embeds],
      components: [btns],
    });
  }

  async function updateImg(confirmation, navigateImg) {
    const embedsNew = embedsMsg.regularPost(postData, navigateImg);

    response = await confirmation.update({
      content: " ",
      embeds: [embedsNew],
      components: [btns],
    });
    getBtnInteraction();
  }

  async function getBtnInteraction() {
    try {
      btnInteraction = await response.awaitMessageComponent({
        time: 60000,
      });

      if (btnInteraction.customId === "confirm") {
        console.log("confirmed");

        if (!postData.date) {
          updatedEmbed = EmbedBuilder.from(embeds).setDescription(
            "Post details confirmed, uploading to FB..."
          );

          await btnInteraction.update({
            embeds: [updatedEmbed],
            components: [],
          });

          await postImage(postData)
            .then((fbConfirm) => {
              confirmFB(
                postData,
                btnInteraction.message,
                embeds,
                updatedEmbed,
                fbConfirm
              );
            })
            .catch((err) => {
              console.log(`error occurred ${err}`);
            });
        } else {
          const postID = await storePost(postData);
          updatedEmbed = EmbedBuilder.from(embeds).setDescription(
            `Post details confirmed and stored successfully👌.\nPost ID: ${postID}`
          );
          await btnInteraction.update({
            embeds: [updatedEmbed],
            components: [],
          });
        }
      } else if (btnInteraction.customId === "cancel") {
        console.log("cancellled");
        await btnInteraction.update({
          content: "Post cancelled 😔",
          embeds: [],
          components: [],
        });
      } else if (btnInteraction.customId === "previousImg") {
        updateImg(btnInteraction, -1);
      } else if (btnInteraction.customId === "nextImg") {
        updateImg(btnInteraction, 1);
      }
    } catch (error) {
      if (error?.code === "InteractionCollectorError") {
        await response.edit({
          content: "Confirmation not received within a minute, cancelling 🫥",
          embeds: [],
          components: [],
        });
        await response.message?.reactions.removeAll();
        console.log("timeout 1 minute");
      } else {
        await response.edit({
          content: "There was an error on the bot side, cancelling 🫥",
          embeds: [],
          components: [],
        });
        await response.message?.reactions.removeAll();
        console.error(error);
      }
    }
  }
  getBtnInteraction();
}

async function DBPostEmbed(rows, cmd, interaction, extra) {
  const DBPost = {
    index: 0,
    post: rows[0],
    size: rows.length,
    page: `${0 + 1}/${rows.length}`,
  };
  const extraObj = {
    name: extra,
    value: "",
  };
  let embed, btns, response, btnInteraction;
  cmd.setDBPost(DBPost.post);
  const embedsMsg = new embedMsg(cmd);

  embed = setEmbed(0);
  response = await interaction.editReply({
    content: " ",
    embeds: [embed],
    components: [btns],
  });

  function setEmbed(navigateImg) {
    if (extraObj.name === "archived") extraObj.value = DBPost.post.fbid;
    else if (extraObj.name === "error") extraObj.value = DBPost.post.errmsg;

    cmd.setDBPost(DBPost.post);

    if (cmd.images?.length > 1) {
      const tempBtns = imgsBtns.concat(postBtns);
      btns = new ActionRowBuilder().addComponents(tempBtns);
    } else btns = new ActionRowBuilder().addComponents(postBtns);

    return (embed = embedsMsg.dbPost(
      cmd,
      extraObj,
      interaction.commandName,
      DBPost.page,
      navigateImg
    ));
  }

  async function updatePost(confirmation, navigatePost) {
    if (navigatePost === 1 && DBPost.size !== DBPost.index + 1) {
      DBPost.index++;
      DBPost.post = rows[DBPost.index];
    } else if (navigatePost === -1 && DBPost.index - 1 >= 0) {
      DBPost.index--;
      DBPost.post = rows[DBPost.index];
    } else DBPost.post = rows[DBPost.index];

    DBPost.page = `${DBPost.index + 1}/${DBPost.size}`;

    embed = setEmbed(0);

    response = await confirmation.update({
      content: " ",
      embeds: [embed],
      components: [btns],
    });
    getBtnInteraction();
  }

  async function updateImg(confirmation, navigateImg) {
    embed = setEmbed(navigateImg);

    response = await confirmation.update({
      content: " ",
      embeds: [embed],
      components: [btns],
    });
    getBtnInteraction();
  }

  async function getBtnInteraction() {
    try {
      btnInteraction = await response.awaitMessageComponent({
        time: 300000,
      });

      if (btnInteraction.customId === "previousPost") {
        updatePost(btnInteraction, -1);
      } else if (btnInteraction.customId === "nextPost") {
        updatePost(btnInteraction, 1);
      } else if (btnInteraction.customId === "previousImg") {
        updateImg(btnInteraction, -1);
      } else if (btnInteraction.customId === "nextImg") {
        updateImg(btnInteraction, 1);
      }
    } catch (error) {
      if (error.code === "InteractionCollectorError") {
        console.log("timeout 5 minutes");
        await response.edit({
          content: " ",
          embeds: [embed],
          components: [],
        });
      } else {
        console.error(error);
        await response.edit({
          content: "There was an error on the bot side, cancelling 🫥",
          embeds: [],
          components: [],
        });
      }
    }
  }
  getBtnInteraction();
}

async function confirmFB(postData, msg, embeds, updatedEmbed, fbConfirm) {
  if (fbConfirm) {
    const postID = await storePost(postData, fbConfirm);
    updatedEmbed = EmbedBuilder.from(embeds).setDescription(
      `Post uploaded successfully👌.\nPost ID: ${postID}`
    );

    await msg.react("✅");
    await msg.edit({ embeds: [updatedEmbed] });
  } else {
    storeErrorPostId(postData.id, "error while uploading the post");
    updatedEmbed = EmbedBuilder.from(embeds).setDescription(
      "There was an error uploading this post. 🫥"
    );
    await msg.react("❌");
    await msg.edit({ embeds: [updatedEmbed] });
  }
}

async function sendScheduledPostMsg(postData, status) {
  const channel = client.channels.cache.get(NOTIFICATION_CHANNEL);

  const embedsMsg = new embedMsg(postData);
  const embeds = embedsMsg.scheduledMsg(postData, status);

  try {
    if (status) {
      const msg = await channel.send({
        embeds: [embeds],
      });
      await msg.react("✅");
    } else {
      const msg = await channel.send({
        embeds: [embeds],
      });
      await msg.react("❌");
    }
  } catch (err) {
    console.error(`Error while sending error message: ${err}`);
  }
}

function getPost(id, postData, interaction) {
  return new Promise(async (resolve, reject) => {
    await getEntry(id)
      .then((row) => {
        postData.setDBPost(row);
        const embedsMsg = new embedMsg(postData);
        const embeds = embedsMsg.dbPost(
          postData,
          "",
          interaction.commandName,
          `${postData.images.indexOf(postData.images[0]) + 1}/${
            postData.images.length
          }`,
          0
        );

        const finalPost = {
          row: postData,
          embeds: embeds,
          embedsMsg: embedsMsg,
        };
        resolve(finalPost);
      })
      .catch((err) => {
        if (err === "noID") {
          console.log(`Post no.${id} doesn't exist!`);
          interaction.editReply({
            content: `Post no.${id} doesn't exist!`,
          });
        } else {
          console.error(`error while trying to get an entry: ${err}`);
          interaction.editReply({
            content: `Couldn't retrieve the entry due to an error: ${err}`,
          });
        }
      });
  });
}

async function confirmDelete(post, interaction) {
  let btns, response, btnInteraction;

  if (post.row.images.length > 1) {
    const tempBtns = imgsBtns.concat(confirmBtns);
    btns = new ActionRowBuilder().addComponents(tempBtns);
  } else btns = new ActionRowBuilder().addComponents(confirmBtns);

  response = await interaction.editReply({
    content: "",
    embeds: [post.embeds],
    components: [btns],
  });

  async function updateImg(confirmation, navigateImg) {
    post.embeds = post.embedsMsg.regularPost(post.row, navigateImg);

    response = await confirmation.update({
      content: " ",
      embeds: [embedsNew],
      components: [btns],
    });
    getBtnInteraction();
  }

  async function getBtnInteraction() {
    try {
      btnInteraction = await response.awaitMessageComponent({
        time: 60000,
      });

      if (btnInteraction.customId === "confirm") {
        console.log("confirmed");
        await storeDeletedPosts(post.row.id)
          .then(async () => {
            await response.edit({
              content: `Deleted of post no.${post.row.id}`,
              embeds: [],
              components: [],
            });
          })
          .catch((err) => console.error(`Error occurred: ${err}`));
      } else if (btnInteraction.customId === "cancel") {
        console.log("cancelled");

        await response.edit({
          content: `Deletion of post no.${post.row.id} done`,
          embeds: [post.embeds],
          components: [],
        });
      } else if (btnInteraction.customId === "previousImg") {
        updateImg(btnInteraction, -1);
      } else if (btnInteraction.customId === "nextImg") {
        updateImg(btnInteraction, 1);
      }
    } catch (error) {
      if (error.code === "InteractionCollectorError") {
        console.log("timeout 1 minute");
        await response.edit({
          content: "Confirmation not received within a minute, cancelling 🫥",
          embeds: [],
          components: [],
        });
      } else {
        console.error(error);
        await response.edit({
          content: "There was an error on the bot side, cancelling 🫥",
          embeds: [],
          components: [],
        });
      }
    }
  }
  getBtnInteraction();
}

function loginDiscord() {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Started refreshing application (/) commands.");
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });

      console.log("Successfully reloaded application (/) commands.");
      await client.login(TOKEN);
      resolve();
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
}

export { loginDiscord, sendScheduledPostMsg };
