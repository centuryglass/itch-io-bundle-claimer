const playwright = require('playwright');

// Known page urls:
const ITCH_URL = 'https://itch.io';
const ITCH_LOGIN = `${ITCH_URL}/login`;
const ITCH_BUNDLES = `${ITCH_URL}/my-purchases/bundles`;


// Milliseconds to delay between claiming games or changing pages. 
// Keep this at a value that mimics how long a real human would take to
// navigate through the links, to avoid over-burdening the itch.io servers.
const NAV_DELAY = 1000;

(async () => {
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage();

    try {
        // Navigate to login page:
        await page.goto(ITCH_LOGIN);
        await page.waitForTimeout(NAV_DELAY);

        // Login using env vars:
        const inputData = [
            ['input[name=username]', process.env.USER],
            ['input[name=password]', process.env.PASS]
        ];
        for (let [selector, text] of inputData) {
            if (!text) {
                throw 'Both USER and PASS environment variables must be '
                        + 'defined.';
            }
            await page.waitForSelector(selector);
            await page.click(selector);
            await page.keyboard.type(text);
        }
        const buttonSelector = '.buttons>button';
        await page.waitForSelector(buttonSelector);
        await page.click(buttonSelector);

        await page.waitForLoadState();
        await page.goto(ITCH_BUNDLES);
        
        // Check all available bundles:
        const bundles = await page.locator('.bundle_keys li a');
        const linkCount = await bundles.count();
        console.log(`Identified ${linkCount} bundle links.`);
        const links = [];
        for (let i = 0; i < linkCount; i++) {
            const bundle = await bundles.nth(i);
            const name = await bundle.allTextContents();
            const link = await bundle.getAttribute('href');
            console.log(`\tFound bundle "${name}" at ${link}`);
            links.push([name, ITCH_URL + link]);
        }

        const gameRecords = {};

        for (let [bundleName, bundleLink] of links) {
            console.log(`Downloading from bundle "${bundleName}" at `
                    + `${bundleLink}`);
            let pageNum = 1;
            let gameCount;

            do {
                await page.goto(bundleLink + '?page=' + pageNum);
                await page.waitForTimeout(NAV_DELAY);
                let games = await page.locator('.game_row_data');
                gameCount = await games.count();
                if (gameCount == 0) {
                    continue;
                }
                console.log(`\tPage ${pageNum}: found ${gameCount} games`);
                
                for(let i = 0; i < gameCount; i++) {
                    const gameEntry = await games.nth(i);
                    const index = (pageNum - 1) * 30 + (i + 1);
                    const title = await gameEntry.locator('.game_title');
                    const titleText = await title.allTextContents();
                    try {
                        let link = await gameEntry.locator(
                                'button[value=claim]', {timeout: 500});
                        let linkFound = await link.count();
                        if (! linkFound) {
                            if (! (titleText in gameRecords)) {
                                gameRecords[titleText] = 'SKIP';
                            }
                            console.log(`\t\t${index}: Skipping `
                                    + `${titleText}, already claimed.`);
                        }
                        else {
                            await link.click({timeout: 5000});
                            await page.waitForLoadState();
                            await page.waitForTimeout(NAV_DELAY);
                            gameRecords[titleText] = 'CLAIM';
                            console.log(`\t\t${index}: Claimed `
                                    + `${titleText}.`);
                            await page.goBack();
                            await page.waitForTimeout(NAV_DELAY);
                        }
                    }
                    catch(err) {
                        console.log(`\t\t${index}: Skipping game `
                                + `${titleText}: ${err}`);
                        await page.goto(bundleLink + '?page=' + pageNum);
                    }
                    games = await page.locator('.game_row_data');
                }
                pageNum++;
            } while(gameCount > 0);
            
        }

        const [gamesClaimed, gamesSkipped] = ['CLAIM', 'SKIP'].map(state => 
                Object.values(gameRecords).filter(v => v === state).length);
        console.log(`Scanned ${links.length} bundles. ${gamesClaimed} games `
                + `claimed, ${gamesSkipped} games already in library.`);
    }
    catch (err) {
        console.log("Unexpected error: " + err);
    }
    await browser.close();
})();

