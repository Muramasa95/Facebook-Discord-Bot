import puppeteer from "puppeteer";

async function getTweetImage(url) {
  let browser = "";
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    console.log("puppeteer launched! Opening a new page.");
    const page = await browser.newPage();
    console.log("Opened a new page, navigating to Twitter.");
    await page.goto(url, { waitUntil: "networkidle0" });
    console.log("Loaded Twitter page, scraping images.");

    const imageLinks = await page.evaluate(() => {
      const imageElements = Array.from(document.querySelectorAll("img"));
      const images = imageElements
        .filter((img) => img.src.includes("media"))
        .map((img) => img.src.split("?")[0] + "?format=jpg&name=large");
      return images;
    });

    if (imageLinks.length > 0) {
      console.log("Image links:");
      imageLinks.forEach((link) => {
        console.log(link);
      });
    } else {
      console.log("No images found in the tweet.");
      return null;
    }

    return imageLinks;
  } catch (error) {
    console.error(error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

//const url = 'https://twitter.com/Apollyon_abyss/status/1593299029185761281'; // 1
//const url = 'https://twitter.com/RandomVNBot/status/1696481603084558624'; // 2
//const url = 'https://twitter.com/_suicidemaster/status/1695410073609412635'; // 4
//const url = 'https://twitter.com/iwamotobusta/status/1666354629842731009'; // breaks the code
export { getTweetImage };
