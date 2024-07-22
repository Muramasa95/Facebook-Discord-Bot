import Pixiv from "@ibaraki-douji/pixivts";
import { uploadImg } from "../imgbb.js";

const pixiv = new Pixiv.Pixiv();

//const illustId = "109897050"; // 1
//const illustId = '96534939'; // 5
//const illustId = '67128611'; // 47

function getPixivImage(pixivUrl, caption, artist) {
  return new Promise(async (resolve, reject) => {
    const artId = pixivUrl.split("/artworks/")[1];

    const artwork = await pixiv
      .getIllustByID(artId)
      .then((res) => {
        // console.log(res);
        return res;
      })
      .catch((err) => console.error(`Error occurred: ${err}`));

    const imagePath = [];
    let imageCount = 1;

    if (!artist) artist = artwork.user.name;

    for (const element of artwork.urls) {
      try {
        imagePath.push({
          no: imageCount,
          url: element.original,
          isLarge: false,
        });
        imageCount++;
      } catch (error) {
        console.error("Error downloading image:", error);
        imagePath = null;
      }
    }
    if (!imagePath) return null;

    // const isSizeLarge = await checkPixivSize(imagePath);
    // if (isSizeLarge) return "size";

    // console.log(imagePath);

    await uploadImg(imagePath, caption, true)
      .then((imageURLs) => {
        const finalResult = { imgs: imageURLs, artist: artist };
        // console.log(finalResult);
        resolve(finalResult);
      })
      .catch((err) => reject(err));
  });
}

export { getPixivImage };
