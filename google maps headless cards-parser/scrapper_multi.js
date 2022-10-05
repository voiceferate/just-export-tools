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


function parseInputArray(file) {
  let file_input_array = fs.readFileSync(file).toString().split("\r\n");
  let preaperedLinks = file_input_array.map((el) => {
    // additional changes can be done here
    return el
  })
  return preaperedLinks
}

try {
  const queryString = parseInputArray('src.txt');
  for (const item of queryString) {
    parseSingle(item)
  }
} catch (error) {
  log.error(error)
}


async function parseSingle(query) {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 600 });

  // query string
  await page.goto(query)

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
  await browser.close();

  log.debug('query nandled succesfully');
};

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

async function handlePlaceClick(placeEl, page) {
  placeEl.click();
  log.info('clicked');

  await page.waitForNetworkIdle();
  await page.waitForSelector('.bJzME.Hu9e2e.tTVLSc')
  await new Promise(r => setTimeout(r, 1200));

  log.warn(await parsePlaceInfo(page))

  await page.click('.VfPpkd-icon-Jh9lGc');
  await page.waitForNetworkIdle();
  await new Promise(r => setTimeout(r, 800));
}

async function parsePlaceInfo(page) {
  let name = await page.evaluate(() => {
    let element = document.querySelectorAll('.lMbq3e .DUwDvf span');
    if(element && element.length) {
      return (element[0].innerText)
    } else {
      return ('place name parce error')
    };
  });

  let activity = await page.evaluate(() => {
    let element = document.querySelectorAll('button[jsaction="pane.rating.category"]');
    if(element && element.length) {
      return (element[0].innerText)
    } else {
      return ('place activity parce error')
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
