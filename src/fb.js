import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import dotenv from "dotenv";
dotenv.config();
const TOKEN = process.env.FB_TOKEN;
const PAGEID = process.env.PAGEID;

// Function to post an image to the page's feed
async function postImage(slashData) {
  const mediaIds = [];
  let comment = "";
  let finalCaption = "";

  if (slashData.comment) comment = "Source: " + slashData.comment;
  if (slashData.caption) finalCaption = slashData.caption;
  if (slashData.artist) finalCaption += "\nBy " + slashData.artist;

  const imageUrl = slashData.images;
  // console.log("Final post properties:", imageUrl, finalCaption, comment);

  return new Promise(async (resolve, reject) => {
    try {
      for (const image of slashData.images) {
        console.log("uploading pic...");

        const formData = new FormData();
        console.log(image);

        formData.append("url", image);

        formData.append("access_token", TOKEN);
        formData.append("published", "false");

        //console.log(formData);

        const imageResponse = await axios.post(
          `https://graph.facebook.com/${PAGEID}/photos`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },
          }
        );

        mediaIds.push({ media_fbid: imageResponse.data.id });
      }
      console.log("images uploaded, posting to feed.");

      const postData = {
        message: finalCaption,
        attached_media: mediaIds,
        access_token: TOKEN,
      };

      const response = await axios.post(
        `https://graph.facebook.com/${PAGEID}/feed`,
        null,
        {
          params: postData,
        }
      );

      const postId = response.data.id;
      if (comment) await addCommentToPost(postId, comment);
      console.log("Pictures posted:", response.data);

      resolve(postId);
    } catch (error) {
      console.error("An error occurred:", error);

      reject(null);
    }
  });
}

async function addCommentToPost(postId, comment) {
  return new Promise(async (resolve, reject) => {
    try {
      const cmnt = await axios.post(
        `https://graph.facebook.com/${postId}/comments`,
        null,
        {
          params: {
            message: comment,
            access_token: TOKEN,
          },
        }
      );

      console.log("Comment added successfully.");

      resolve(cmnt);
    } catch (error) {
      console.error(
        "Error adding comment:",
        error?.response?.data?.error?.message
      );
      reject();
    }
  });
}

async function checkReach() {
  // under construction
}

export { postImage, checkReach };
