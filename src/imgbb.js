import axios from "axios";
import { config } from "dotenv";
config();

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

export async function uploadImg(imgs, caption, isPixiv) {
  let response,
    isLarge = false,
    img_name = "";
  const imgURLs = [];

  const promises = imgs.map((img) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (caption) img_name = `${caption}_${img.no}`;

        console.log("uploading img to imgbb\n" + img.url, img_name);

        response = await axios.post(
          `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
          null,
          {
            params: { image: img.url, name: img_name },
          }
        );
        // console.log(response.data.data.url);

        imgURLs.push({ no: img.no, url: response.data.data.url });
        resolve();
      } catch (err) {
        console.error(`error while uploading to imgbb: ${err}`);
        reject(err);
      }
    });
  });

  await Promise.all(promises);

  if (imgURLs.length > 1) imgURLs.sort((a, b) => a.no - b.no);

  if (isPixiv) {
    await getImageSize(imgURLs);
  }
  // console.log(imgURLs);

  if (!isLarge) return imgURLs.map((obj) => obj.url);
  else return "size";

  async function getImageSize() {
    const promises = imgURLs.map((img) => {
      return new Promise(async (resolve, reject) => {
        try {
          // Make a HEAD request to get the content length
          const response = await axios.head(img.url);

          // console.log(response);

          // Check if the content-length header is present
          if (response.headers["content-length"]) {
            const sizeInBytes = parseInt(
              response.headers["content-length"],
              10
            );
            console.log(`Image size: ${sizeInBytes} bytes`);
            if (sizeInBytes > 10000000) isLarge = true;
            resolve();
          } else {
            console.error("Content-length header not found in the response.");
            isLarge = true;
            reject();
          }
        } catch (error) {
          console.error(
            "Error fetching or processing the image:",
            error.message
          );
          isLarge = true;
          reject();
        }
      });
    });

    await Promise.all(promises);
  }
}
