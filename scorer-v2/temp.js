const axios = require('axios');
const needle = require('needle');
const https = require("https");


axios.get("https://www.theiss.sk/", 

)
.then((res) => {
  console.log("axios", res.data);
  console.log("axios status", res.status)
}
)
.catch((error) => {
  console.log(error)
})

needle('get', 'https://www.theiss.sk/')
  .then(function(resp) {
    console.log("needle", resp.data);
    console.log("needle status", res.status)
  })
  .catch(function(error) {
    console.log(error)
  });