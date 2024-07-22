
async function getDeviantImage(url) {
    return null;
    const browser = await puppeteer.launch( { headless: "new"} );
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const imageLinks = await page.evaluate(() => {
        const imageElements = document.querySelectorAll('img');
        const images = Array.from(imageElements).map(img => img.src); // Remove query parameters
        return images;
    });

    console.log(imageLinks)
    if (imageLinks.length > 0) {
        console.log('Image links:');
        imageLinks.forEach(link => {
            console.log(link);
        });
    } else {
        console.log('No images found in the link.');
    }

    await browser.close();
}

export { getDeviantImage };