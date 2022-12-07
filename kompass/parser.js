const axios = require('axios');



let counter = 0

for (let index = 0; index < 10; index++) {
  axios("https://fr.kompass.com/c/infos-france/fr8106387/", {
    timeout: 100000,
    maxRedirects: 10,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246',
      // "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:107.0) Gecko/20100101 Firefox/107.0",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "uk-UA,uk;q=0.8,en-US;q=0.5,en;q=0.3",
      "Accept-Encoding": "gzip, deflate, br",
      "Connection": "keep-alive",
      "Cookie": "timezoneoffset=-120; _gcl_au=1.1.987768080.1669882748; route=1669882808.548.35.222240|1ca372b33d2bad9524c20eaf607b64ca; ROUTEID=.; timezoneoffset=-120; _ga=GA1.3.1671626283.1669882810; _gid=GA1.3.2088165420.1669882810; axeptio_cookies={%22$$token%22:%22l8j48y0r1honj87phub8o%22%2C%22$$date%22:%222022-12-01T08:20:26.864Z%22%2C%22SnapEngage%22:true%2C%22Double_Click%22:true%2C%22facebook_pixel%22:true%2C%22ShinyStat%22:true%2C%22$$completed%22:true}; axeptio_authorized_vendors=%2CSnapEngage%2CDouble_Click%2Cfacebook_pixel%2CShinyStat%2C; axeptio_all_vendors=%2CSnapEngage%2CDouble_Click%2Cfacebook_pixel%2CShinyStat%2C; _ga=GA1.2.1671626283.1669882810; kompass-cart=ed22b924-258f-4858-b3a7-eb348eb79f4d; JSESSIONID=BE12659983BAD47D6E3F31F02973B2AA; SnapABugRef=https%3A%2F%2Ffr.kompass.com%2Fen%2Fx%2Fdistributor%2F%20; _k_cty_lang=en_FR; SnapABugHistory=5#; SnapABugUserAlias=%23; SnapABugVisit=1#1669969845; kp_uuid=49a10d42-022b-4145-8d91-155c93d2f723; datadome=1K7k_lWslSZYYGgHHf9vIcLfsHlH3VGmzAFjCmioiiBUgHUDapL2OLAnSk~BxXFQh4mEHRzYvgZM32vE-iNeHhOP6Of0-xU_kKymyKOSClPZYSlwQLJ3ETvq0aY1Fydf",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "TE": "trailers,"

    }
    // httpsAgent: new https.Agent({ keepAlive: true }),
  })
    .then(response => {
      const html = response.data.toLowerCase();
      console.log("status", response.status)
      // console.log(html)
      console.log("counter", index)
    })

    .catch(error => {
      console.log(error)
    })
}

