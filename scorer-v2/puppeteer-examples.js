// Parallel code:
const puppeteer = require("puppeteer");

let browser;
(async () => {
  browser = await puppeteer.launch();
  const [page] = await browser.pages();
  const baseURL = "https://stackoverflow.com/users";
  const startId = 6243352;
  const qty = 5;

  const usernames = (await Promise.allSettled(
    [...Array(qty)].map(async (_, i) => {
      const page = await browser.newPage();
      await page.goto(`${baseURL}/${i + startId}`, {
        waitUntil: "domcontentloaded"
      });
      const sel = ".flex--item.mb12.fs-headline2.lh-xs";
      const el = await page.waitForSelector(sel);
      const text = await el.evaluate(el => el.textContent.trim());
      await page.close();
      return text;
    })))
    .filter(e => e.status === "fulfilled")
    .map(e => e.value)
  ;
  console.log(usernames);
})()
  .catch(err => console.error(err))
  .finally(() => browser.close())
;

// Serial code:
const puppeteer = require("puppeteer"); // ^14.3.0

let browser;
(async () => {
  browser = await puppeteer.launch({dumpio: false});
  const [page] = await browser.pages();
  const baseURL = "https://stackoverflow.com/users";
  const startId = 6243352;
  const qty = 5;
  const usernames = [];

  for (let i = startId; i < startId + qty; i++) {
    await page.goto(`${baseURL}/${i}`, {
      waitUntil: "domcontentloaded"
    });
    const sel = ".flex--item.mb12.fs-headline2.lh-xs";
    const el = await page.waitForSelector(sel);
    usernames.push(await el.evaluate(el => el.textContent.trim()));
  }

  console.log(usernames);
})()
  .catch(err => console.error(err))
  .finally(() => browser.close())
;