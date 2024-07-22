async function getTumblrImage(url) {
  return null;
  let browser;
  try {
    browser = await firefox.launch({
      headless: true,
    });

    console.log("Playwright launched with WebKit! Opening a new page.");
    const page = await browser.newPage();
    console.log("Opened a new page, navigating to imgur.");
    await page.goto(url, { waitUntil: "networkidle0" });
    console.log("Loaded imgur page, scraping images.");

    const imageLinks = await page.evaluate(() => {
      const imageElements = Array.from(document.querySelectorAll("img"));
      console.log(imageElements);
      const images = imageElements
        .filter((img) => img.src.includes("i.imgur"))
        .map((img) => img.src.split("_d")[0]);
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

export { getTumblrImage };
