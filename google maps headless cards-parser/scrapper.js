const log = require('cllc')();
const puppeteer = require('puppeteer');
const fs = require('fs');

var wstream = fs.createWriteStream('parse_result.csv');

const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const csvStringifier = createCsvStringifier({
    header: [
        {id: 'name', title: 'name'},
        {id: 'activity', title: 'activity'},
        {id: 'address', title: 'address'},
        {id: 'phone', title: 'phone'},
        {id: 'siteUrl', title: 'siteUrl'},
    ]
  });

wstream.write(csvStringifier.getHeaderString());
log.start('%s lines done.', 0);



(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 600 });

  // query string
  await page.goto('https://www.google.com.ua/maps/search/%D0%90%D1%85%D0%B0%D0%BB%D1%86%D1%96%D1%85%D0%B5+%D0%BC%D0%B0%D0%B3%D0%B0%D0%B7%D0%B8%D0%BD+%D0%BC%D0%B5%D0%B1%D0%B5%D0%BB%D0%B8/@41.6340688,42.9785434,14z/data=!3m1!4b1?hl=ru')

  await page.waitForSelector('.Nv2PK.THOPZb.CpccDe', { timeout: 60000 })

  await autoScroll(page);
  log.warn('scroll ended')

  const placesElemsArray = await page.$$('.hfpxzc');

  if (placesElemsArray && placesElemsArray.length) {
    for (const place of placesElemsArray) {
      log.trace('step');
      await handlePlaceClick(place, page)
    }
  }
  
  await page.close();
  log.debug('file written succesfully');
})();

async function autoScroll(page){
    let endOfListSelector =  await page.$('.PbZDve');
    
    if (!!endOfListSelector) {
      log('end selector')
      return true;
    }

    let placesCards =  await page.$$('.hfpxzc');

    if (placesCards.length > 99) {
      log('too much places cards')
      return true;
    }

    log.warn(placesCards.length)

    async function clickPlaceCard(cardsArray) {
      cardsArray[cardsArray.length - 1].click()
    }


    // let lastPalceItemCard = await page.$$('.Nv2PK.THOPZb.CpccDe')
    // await lastPalceItemCard[lastPalceItemCard.length - 1].hover()
    new Promise(r => setTimeout(r, 500));


    await page.evaluate(() => {
      const scrollElem = document.querySelectorAll('.m6QErb.DxyBCb.kA9KIf.dS8AEf.ecceSd')[1];
      scrollElem.scrollTop = scrollElem.scrollTop - 300;
    })
    
    await page.waitForNetworkIdle();

    await page.evaluate(() => {
      document.querySelectorAll('.m6QErb.DxyBCb.kA9KIf.dS8AEf.ecceSd')[1].scrollTop = 100000
    })

    await page.waitForNetworkIdle();
    await autoScroll(page)

  }

async function parsePlases(page) {
  let places = [];

  const elements = await page.$$('.NrDZNb .qBF1Pd.fontHeadlineSmall span');
  if (elements && elements.length) {
    for (const el of elements) {
      const name = await el.evaluate(span => span.textContent)

      places.push({ name });
    }
  }

  return places;
}

async function handlePlaceClick(placeEl, page) {
  placeEl.click();
  log.info('clicked');

  await page.waitForNetworkIdle();
  await page.waitForSelector('.bJzME.Hu9e2e.tTVLSc')
  await new Promise(r => setTimeout(r, 800));

  log.warn(await parsePlaceInfo(page))

  await page.click('.VfPpkd-icon-Jh9lGc');
  await page.waitForNetworkIdle();
  await new Promise(r => setTimeout(r, 300));
}

async function parsePlaceInfo(page) {
  let name = await page.evaluate(() => {
    let element = document.querySelectorAll('.lMbq3e .DUwDvf span');
    if(element && element.length) {
      return (element[0].innerText)
    } else {
      return (element[0].innerText)
    };
  });

  let activity = await page.evaluate(() => {
    let element = document.querySelectorAll('button[jsaction="pane.rating.category"]');
    if(element && element.length) {
      return (element[0].innerText)
    } else {
      return (element[0].innerText)
    };
  });

  let address = await page.evaluate(() => {
    let element = document.querySelectorAll('[data-item-id="address"] .rogA2c .Io6YTe');
    if(element && element.length) {
      return (element[0].innerText)
    };
  });

  let phone = await page.evaluate(() => {
    let element = document.querySelectorAll('[data-item-id^="phone:tel"]');
    if(element && element.length) {
      return (element[0].innerText.replace(/\s/g, ''))
    };
  });

  let siteUrl = await page.evaluate(() => {
    let element = document.querySelectorAll('a[data-item-id="authority"]');
    if(element && element.length) {
      return (element[0].href)
    };
  });

  let currentString = [{
    name: name.replace(/,/g, ''),
    activity,
    address,
    phone,
    siteUrl
  }]

  wstream.write(csvStringifier.stringifyRecords(currentString));
  log.step();

  return {
    name,
    activity,
    address,
    phone,
    siteUrl
  }

}
