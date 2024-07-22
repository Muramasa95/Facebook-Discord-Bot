
async function getArtstationImage(url) {
    return null;
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: 'new',
      });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2' });

    const imageLinks = await page.evaluate(() => {
        const imageElements = document.querySelectorAll('img');
        const images = Array.from(imageElements)
            .filter(img => img.src.includes('media'))
            .map(img => img.src);
        return images;
    });

    if (imageLinks.length > 0) {
        console.log('Image links:');
        imageLinks.forEach(link => {
            console.log(link);
        });
    } else {
        console.log('No images found in the link.');
        return null;
    }
    await browser.close();
    return imageLinks;
}

export { getArtstationImage };

//const url = 'https://www.artstation.com/artwork/nQ8wO9'; // 1
//const url = 'https://www.artstation.com/artwork/4bDqPk'; // 7
//const url = 'https://www.artstation.com/artwork/YaxmQd'; // 8
