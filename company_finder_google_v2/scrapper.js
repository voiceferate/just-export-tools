const fs = require('fs');
const log = require('cllc')();
const puppeteer = require('puppeteer')


var wstream = fs.createWriteStream('myOutput.csv');

const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const csvStringifier = createCsvStringifier({
    header: [
        // {id: 'line_number', title: 'line_number'},
        {id: 'query_string', title: 'query_string'},
        {id: 'company_name', title: 'company_name'},
        {id: 'address', title: 'address'},
        {id: 'phone', title: 'phone'},
        {id: 'site', title: 'site'},
        // {id: 'altSite', title: 'altSite'},
    ]
  });

wstream.write(csvStringifier.getHeaderString());



async function openSearchPage() {
  const browser = await puppeteer.launch({
    headless: false,
    ignoreHTTPSErrors: true,
    args: [
      // '--start-fullscreen',
      '-start-maximized',
      '--incognito',
      '--no-sandbox',
    ],
  })

  try {
    log('Початок роботи');


    const page = await browser.newPage()
    
    page.setViewport({
      width: 1360,
      height: 760,
    })


    await page.goto('https://www.google.com.ua')


    const searchNames = parseInputArray('src.csv');
    
    
    log.warn(`кількість запитів: ${searchNames.length}`);
    let counter = 1;

    for (const item of searchNames) {
      log(`запит: ${counter}`)

      await page.$eval('input', el => el.value = '');

      await page.type('input', item); // Types slower, like a user , {delay: 189}
      await page.keyboard.press('Enter');
      await page.waitForNavigation({
        waitUntil: ['networkidle2', 'domcontentloaded'],
        timeout: 10000
      });

      try {
        const card = await page.waitForSelector('.kp-wholepage', { timeout: 1000 })
        // await clickByText(`Сайт`);
        log.info("card finded ______________")
  
        let name = await page.evaluate(() => {
          let link = document.querySelector('.kp-wholepage h2 span')
  
          return (link.innerText)
        });
  
        let site = await page.evaluate(() => {
          let links = document.querySelectorAll('a.ab_button')
  
          for (let index = 0; index < links.length; index++) {
            if (links[index].innerText === "Cайт") {
              return (links[index].href)
            }
          }
        });
  
        let address = await page.evaluate(() => {
          let links = document.querySelectorAll('a.fl')
  
          for (let index = 0; index < links.length; index++) {
            if (links[index].innerText === "Адреса") {
              return (links[index].closest('span').parentNode.childNodes[1].innerHTML)
            }
          }
        });
  
        let phone = await page.evaluate(() => {
          let links = document.querySelectorAll('a.fl')
  
          for (let index = 0; index < links.length; index++) {
            if (links[index].innerText === "Телефон") {
              return (links[index].closest('span').parentNode.childNodes[1].innerText)
            }
          }
        });
  
  
        log.warn(site, address, phone)
  
        if (site === undefined) {site = ''}
        if (address === undefined) {address = ''}
        if (phone === undefined) {phone = ''}
        if (name === undefined) {name = ''}

        let currentString = [{
          'line_number': counter,
          company_name: delBr(name),
          address: delBr(address),
          phone: delBr(phone),
          site: delBr(site),
          // altSite: '',
          query_string: item
        }]
  
        wstream.write(csvStringifier.stringifyRecords(currentString));
  
  
      } catch (error) {
        log.trace(`no card finded`)
  
        let altSite = await page.evaluate((item) => {
          let links = document.querySelectorAll('.yuRUbf>a')
  
          for (let index = 0; index < links.length; index++) {
              // console.log('item inside: ', item)
            if (links[index].host.replace("www.", "").indexOf(item.toLowerCase().slice(0, 3)) !== -1) {
              return altSite = links[index].href
            } else {
              return altSite = ''
            }
          }
        }, item);
  
        if (!!altSite) {
          log.debug('altSite: ', altSite)
        }

        let currentString = [{
          'line_number': counter,
          company_name: '',
          address: '',
          phone: '',
          site: altSite,
          // altSite,
          query_string: item
        }]
  
        wstream.write(csvStringifier.stringifyRecords(currentString));
      }

      log(`кінець запиту ${counter}: ${item}`)
      counter++

    }


  } catch (error) {
    log.error('can`t open new page')
    log.error(error)
  }

  log.finish('all done')
  await browser.close()

}

function parseInputArray(file) {
  let file_input_array = fs.readFileSync(file).toString().split("\r\n");
  let preaperedLinks = file_input_array.map((el) => {
    // additional changes can be done here
    return el
  })
  return preaperedLinks
}

function delBr (s) {return s.replace (/\s{2,}/g, ' ')};




openSearchPage();


