const { exit } = require('process');
const log = require('cllc')();
const axios = require('axios');
const fs = require('fs');
const puppeteer = require('puppeteer');



const places = require('./countries');

const arguments = process.argv.slice(2)

if (arguments.length == 0 || arguments.length !== 2) {
  log.e('arguments empty or has a wrong format');
  exit();
}

if (!places.countriesList.hasOwnProperty(arguments[1].toUpperCase())) {
  log.e('you have entered nonexistent country shortname');
  exit();
}

// масив запитів для перебору

const queriesArray = places.makeQueriesArray(arguments)
log(queriesArray)


// function* makeQueriesArrayIterable() {
//   places.makeQueriesArray(arguments).forEach(element => {
//     yield 1;
//   });
// }

function* foo(index, array) {
  
  while (index < 4) {
    yield array[index];
    index++;
  }
}

const iterator = foo(queriesArray);

console.log(iterator.next());
// expected output: 0

console.log(iterator.next());
// expected output: 1


async function grabLinks() {




  // const browser = await puppeteer.launch({headless: false});
  // const page = await browser.newPage();
  // page.setViewport({ width: 1280, height: 600 });

  // await page.goto("https://www.google.com.ua/maps/?hl=en");
  
  // await page.waitForSelector('input#searchboxinput', { timeout: 5000 })
  
  // await page.type('input#searchboxinput', item); // Types slower, like a user , {delay: 189}
  // await page.keyboard.press('Enter');
  // await page.waitForNavigation({
  //   waitUntil: ['networkidle2', 'domcontentloaded'],
  //   timeout: 60000
  // });

  // for await (const item of makeQueriesArrayIterable()) {
  //   console.log(item);
  //   // expected output: 1

    
  // }

}

grabLinks();

// якась магіябизібрати лінки
let gmapsPlacesLinksArray = [
  // "https://www.google.com.ua/maps/place/%C2%AB%D0%9D%D0%B0+%D0%9C%D0%BE%D1%81%D1%82%D0%B8%D1%81%D1%8C%D0%BA%D1%96%D0%B9%C2%BB/data=!4m7!3m6!1s0x4730a3352e68e59d:0x5491b9c59d3c3880!8m2!3d49.0463591!4d24.3617038!16s%2Fg%2F11gydh3vy6!19sChIJneVoLjWjMEcRgDg8ncW5kVQ?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/Palermo/data=!4m7!3m6!1s0x4730a25bd7fc8f1f:0x22d6747b175b5b3d!8m2!3d49.031277!4d24.3601277!16s%2Fg%2F11clsh9_rv!19sChIJH4_811uiMEcRPVtbF3t01iI?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/%D0%A0%D0%B0%D0%B4%D1%96%D1%83%D1%81/data=!4m7!3m6!1s0x4730a242ea1f393b:0x50275a3b56cb160!8m2!3d49.0378961!4d24.3555844!16s%2Fg%2F11ckqs11_x!19sChIJOzkf6kKiMEcRYLFstaN1AgU?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/Sunrise+cafe+(%D0%9A%D0%B0%D1%84%D0%B5+%D0%9A%D0%B0%D0%BB%D1%83%D1%88)/data=!4m7!3m6!1s0x4730a2f9917f2d67:0x3d33350b6296fd9f!8m2!3d49.0242538!4d24.3689763!16s%2Fg%2F11bxjrlbgq!19sChIJZy1_kfmiMEcRn_2WYgs1Mz0?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/%D0%9A%D0%BE%D1%80%D1%81%D0%B0%D1%80/data=!4m7!3m6!1s0x4730a21507182879:0x5847a14e790893ea!8m2!3d49.0437389!4d24.3491752!16s%2Fg%2F11fy7gny73!19sChIJeSgYBxWiMEcR6pMIeU6hR1g?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/G.R.A.M/data=!4m7!3m6!1s0x4730a309b013c38b:0x6084fbdbcd82ab1f!8m2!3d49.0411762!4d24.3612522!16s%2Fg%2F11rgt0c1vf!19sChIJi8MTsAmjMEcRH6uCzdv7hGA?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/%D0%90%D0%BD%D0%BD%D0%B0+%D0%9C%D0%B0%D1%80%D1%96%D1%8F/data=!4m7!3m6!1s0x4730a26f2b9f70e5:0xe3be5a3cdd3c01c3!8m2!3d49.0415436!4d24.3610507!16s%2Fg%2F1tdrw2c1!19sChIJ5XCfK2-iMEcRwwE83TxavuM?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/%D0%9C%D0%B0%D0%BB%D1%8C%D0%B2%D0%B0/data=!4m7!3m6!1s0x4730a25b88e00157:0x9c155559dcc0d62d!8m2!3d49.0331626!4d24.3590713!16s%2Fg%2F11d_z1_v5x!19sChIJVwHgiFuiMEcRLdbA3FlVFZw?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/%D0%9A%D0%B0%D1%84%D0%B5+%22%D0%A7%D0%B0%D0%B9%D0%BA%D0%B0%22/data=!4m7!3m6!1s0x4730a2b0c8dab0c7:0x5d68acbaaed7b81c!8m2!3d49.0287061!4d24.4186196!16s%2Fg%2F11dxh8d9kj!19sChIJx7DayLCiMEcRHLjXrrqsaF0?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/%D0%9A%D1%83%D0%BA%D1%83%D1%80%D1%83%D0%B4%D0%B7%D0%B0/data=!4m7!3m6!1s0x4730a2fed2d0b66d:0x60486ecbe2bbf89a!8m2!3d49.02274!4d24.3637506!16s%2Fg%2F12jljsz0l!19sChIJbbbQ0v6iMEcRmvi74stuSGA?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/%D0%97%D0%95%D0%9B%D0%95%D0%9D%D0%90+%D0%A2%D0%98%D0%A8%D0%90,+%D0%9A%D0%90%D0%A4%D0%95,+%D0%94%D0%9E%D0%9B%D0%98%D0%9D%D0%9A%D0%90+%D0%91%D0%9E%D0%93%D0%94%D0%90%D0%9D+%D0%A0%D0%9E%D0%9C%D0%90%D0%9D%D0%9E%D0%92%D0%98%D0%A7,+%D0%9F%D0%9F/data=!4m7!3m6!1s0x4730a26f2b9f70e5:0x774d7a7eb45be404!8m2!3d49.0268868!4d24.3690939!16s%2Fg%2F1tj1l8d7!19sChIJ5XCfK2-iMEcRBORbtH56TXc?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/Vintage+Plus/data=!4m7!3m6!1s0x4730a258bf7f8bd3:0x3f8730dfcd1227b3!8m2!3d49.0308875!4d24.3660131!16s%2Fg%2F11b86vrfmv!19sChIJ04t_v1iiMEcRsycSzd8whz8?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/BarWineOk/data=!4m7!3m6!1s0x4730a244c0a0f187:0x8e5a8633c3709409!8m2!3d49.0335117!4d24.3523754!16s%2Fg%2F1pv083n7j!19sChIJh_GgwESiMEcRCZRwwzOGWo4?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/%D0%9C%D0%B0%D1%80%D1%96%D0%B0%D0%BD%D0%BD%D0%B0/data=!4m7!3m6!1s0x4730a2df6ec52c1f:0xeee80b324e7036a5!8m2!3d49.01127!4d24.390321!16s%2Fg%2F12lsd6j75!19sChIJHyzFbt-iMEcRpTZwTjIL6O4?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/Pizza+ROMA/data=!4m7!3m6!1s0x4730a25c8646b5fd:0x202edb91da1adf51!8m2!3d49.032951!4d24.3592805!16s%2Fg%2F11btwtty6k!19sChIJ_bVGhlyiMEcRUd8a2pHbLiA?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/%D0%9A%D0%B0%D1%81%D0%B0%D0%B1%D0%BB%D0%B0%D0%BD%D0%BA%D0%B0/data=!4m10!3m9!1s0x4730a268197221dd:0xc624d45ec526a8!5m2!4m1!1i2!8m2!3d49.039555!4d24.3576439!16s%2Fg%2F1tg4vm1s!19sChIJ3SFyGWiiMEcRqCbFXtQkxgA?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/%D0%A8%D0%BF%D0%B8%D0%BB%D1%8C%D0%BA%D0%B0/data=!4m7!3m6!1s0x4730a310d0454c8d:0x8d3a4eba668ef301!8m2!3d49.0434555!4d24.3476801!16s%2Fg%2F11rcvbyh43!19sChIJjUxF0BCjMEcRAfOOZrpOOo0?authuser=0&hl=uk&rclk=1",
  "https://www.google.com.ua/maps/place/%D0%9A%D0%B0%D1%84%D0%B5+%22%D0%93%D1%80%D0%B8%D0%BB%D1%8C-%D0%91%D0%B0%D1%80%22/data=!4m7!3m6!1s0x4730a2f78c1ec853:0xc31050192d579c00!8m2!3d49.0268858!4d24.366915!16s%2Fg%2F11c6y96416!19sChIJU8gejPeiMEcRAJxXLRlQEMM?authuser=0&hl=uk&rclk=1",
  "https://www.google.com.ua/maps/place/Royal+Coffee/data=!4m7!3m6!1s0x4730a301918543a7:0x4158ba72e3dfeb53!8m2!3d49.0371351!4d24.357035!16s%2Fg%2F11j57d69s4!19sChIJp0OFkQGjMEcRU-vf43K6WEE?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/Soho/data=!4m7!3m6!1s0x4730a3e843034ff1:0x9d138b7868b10015!8m2!3d49.0242833!4d24.3692779!16s%2Fg%2F11r64cpqm5!19sChIJ8U8DQ-ijMEcRFQCxaHiLE50?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/%D0%9A%D0%BE%D1%80%D0%B8%D1%86%D1%8F/data=!4m7!3m6!1s0x4730a3fb4b16292f:0x51bfd66cbabb2c3b!8m2!3d49.030171!4d24.360888!16s%2Fg%2F11gngg2gl4!19sChIJLykWS_ujMEcROyy7umzWv1E?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/Blueberry+Bar/data=!4m7!3m6!1s0x4730a25c8df511c9:0xb12112962bb85d8d!8m2!3d49.0348703!4d24.358232!16s%2Fg%2F11g9qvnmd6!19sChIJyRH1jVyiMEcRjV24K5YSIbE?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/Pekari+Bakery/data=!4m7!3m6!1s0x4730a3f3e56b4a71:0x804a043602c59eef!8m2!3d49.0246511!4d24.3638408!16s%2Fg%2F11kxgrnxkl!19sChIJcUpr5fOjMEcR757FAjYESoA?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/%D0%9F%D1%96%D1%81%D0%BE%D1%87%D0%BD%D0%B8%D1%86%D1%8F/data=!4m7!3m6!1s0x4730a257d9087fd1:0xd7097c2031f6e9f0!8m2!3d49.0251159!4d24.3630142!16s%2Fg%2F11d_74q7rf!19sChIJ0X8I2VeiMEcR8On2MSB8Cdc?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/Buffet/data=!4m7!3m6!1s0x4730a3007523d817:0x4adb424210441cfd!8m2!3d49.0310757!4d24.3592014!16s%2Fg%2F11q8t666pj!19sChIJF9gjdQCjMEcR_RxEEEJC20o?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/%D0%A2%D0%B0%D0%B2%D0%B5%D1%80%D0%BD%D0%B0+%D0%92%D0%BE%D0%BB%D1%85%D0%B0/data=!4m7!3m6!1s0x4730a258c58cf5d7:0x55fb08469d7b4c03!8m2!3d49.0312565!4d24.3658518!16s%2Fg%2F11csrl2ywk!19sChIJ1_WMxViiMEcRA0x7nUYI-1U?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/%D0%92%D0%B5%D0%B6%D0%B0/data=!4m7!3m6!1s0x4730a26f2b9f70e5:0xa29a5eef6cb289ff!8m2!3d49.0209739!4d24.3813553!16s%2Fg%2F11xc0pfzj!19sChIJ5XCfK2-iMEcR_4mybO9emqI?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/%D0%A0%D0%B5%D1%81%D1%82%D0%BE%D1%80%D0%B0%D0%BD-%D0%9A%D0%B0%D1%80%D0%B0%D0%BE%D0%BA%D0%B5+%22Dilectus%22/data=!4m7!3m6!1s0x4730a39dd6ea2cc5:0x8504aacebd1e03b6!8m2!3d49.0227159!4d24.3717381!16s%2Fg%2F11htzplmpl!19sChIJxSzq1p2jMEcRtgMevc6qBIU?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/%D0%A0%D0%95%D0%92%D0%AE/data=!4m7!3m6!1s0x4730a26f2b9f70e5:0xf28bc7df0cdf148!8m2!3d49.0364226!4d24.3611492!16s%2Fg%2F1hg4y4405!19sChIJ5XCfK2-iMEcRSPHN8H28KA8?authuser=0&hl=uk&rclk=1",
  // "https://www.google.com.ua/maps/place/911+fast+food+cafe/data=!4m7!3m6!1s0x4730a3f87c9915df:0xb5b376d10325fada!8m2!3d49.0400575!4d24.352523!16s%2Fg%2F11rf5bky2k!19sChIJ3xWZfPijMEcR2volA9F2s7U?authuser=0&hl=uk&rclk=1"
]

let currentIteratorStep = 0;
function placesLinksIterator(array) {
  if (currentIteratorStep === array.length) {
    log.debug('process finished succesfully');
    return false;
  }

  ++currentIteratorStep
  // log.info(array[currentIteratorStep-1]);
  return array[currentIteratorStep - 1]
}

async function parseLink(url) {
  if (url === false) {
    log.debug('exit');

    // log.debug(resp.toString())

    // fs.writeFileSync('resp1111.txt', resp, err => {
    //   if (err) {
    //     console.error(err);
    //   }
    //   // file written successfully
    // });

    exit();
  }

  await axios(url)
    .then(response => {
      log.info(response.status)

      // handleResponseData(response.data)
      
      //returns data array
      log.info(handleResponseData(response.data))

    })
    .catch(error => {
      log.error(error)
    });


  await parseLink(placesLinksIterator(gmapsPlacesLinksArray))
}






// parseLink(placesLinksIterator(gmapsPlacesLinksArray))

function handleResponseData(data) {
  const currentLine = {}


  
  const infoStrEnd = data.indexOf('itemprop="name">');
  const infoStrStart = data.lastIndexOf('<meta content=', infoStrEnd);
  let infoStr = data.slice(infoStrStart + 15, infoStrEnd - 2);

  infoStr = infoStr.split(' · ');
  currentLine.name = infoStr[0];
  currentLine.address = infoStr[1];

  const activityStrEnd = data.indexOf('" itemprop="description">');
  const activityStrStart = data.lastIndexOf('<meta content="', activityStrEnd)
  const activity = data.slice(activityStrStart + 23, activityStrEnd);

  currentLine.activity = activity;

  const phoneStrStart = data.indexOf('tel:')
  const phoneStrEnd = data.indexOf('",', phoneStrStart);
  if (phoneStrStart !== -1 ) {
    currentLine.phone = data.slice(phoneStrStart + 4, phoneStrEnd - 1);
  } else {
    currentLine.phone = 'null';
  }

  const siteStrStart = data.indexOf(`],null,null,[\\"/url?q\\\\u003dhttp`)
  const siteStrEnd = data.indexOf(`u0026sa`, siteStrStart);
  if (siteStrStart !== -1 ) {
    try {
      currentLine.site = data.slice(siteStrStart + 28, siteStrEnd - 2 )
      currentLine.site = decodeURIComponent(currentLine.site);
      currentLine.site = decodeURIComponent(currentLine.site);
    } catch (error) {
      log.error(error)
    }
  } else {
    currentLine.site = 'null';
  }
  
  // log.warn(`site:${currentLine.site}`)

  return currentLine
}