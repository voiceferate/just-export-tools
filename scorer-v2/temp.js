const axios = require('axios');
const needle = require('needle');
const https = require("https");


axios.get("https://www.kavlak.com.tr", 

)
.then((res) => {
  console.log("axios", res.data);
  console.log("axios status", res.status)
}
)
.catch((error) => {
  console.log(error)
})

needle('get', 'https://www.kavlak.com.tr')
  .then(function(resp) {
    console.log("needle", resp.data);
    console.log("needle status", res.status)
  })
  .catch(function(error) {
    console.log(error)
  });