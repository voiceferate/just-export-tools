const axios = require('axios');
const needle = require('needle');
const https = require("https");


// axios.get("https://www.kavlak.com.tr", 
axios.get("https://www.brenntag.ro/", 

)
.then((res) => {
  console.log("axios", res.data);
  console.log("axios status", res.status)
}
)
.catch((error) => {
  console.log("errno", error.code)
  console.log(error)
})

// const url = "https://www.google.com/";



// async function getURLs() {
//   for (let index = 0; index < 3; index++) {
//     console.log(`step ${index}`)

//     await axios.get(url)
//       .then((res) => {
//         // console.log("axios", res.data);
//         console.log("axios status", res.status)
//       }
//       )
//       .catch((error) => {
//         console.log("errno", error.code)
//         console.log(error)
//       })
//     await axios.get(url)
//       .then((res) => {
//         // console.log("axios", res.data);
//         console.log("axios status second req", res.status)
//       }
//       )
//       .catch((error) => {
//         console.log("errno", error.code)
//         console.log(error)
//       })

//     await new Promise(resolve => setTimeout(resolve, 1000));
//     console.log(`step ${index} end`)


//   }
// }

// function getAllForEach(arr) {
//   arr.forEach(async (val, index) => {
//     await axios.get(url)
//       .then((res) => {
//         // console.log("axios", res.data);
//         console.log("axios status", res.status)
//       }
//       )
//       .catch((error) => {
//         console.log("errno", error.code)
//         console.log(error)
//       })
//     await axios.get(url)
//       .then((res) => {
//         // console.log("axios", res.data);
//         console.log("axios status second req", res.status)
//       }
//       )
//       .catch((error) => {
//         console.log("errno", error.code)
//         console.log(error)
//       })

//     await new Promise(resolve => setTimeout(resolve, 1000));
//     console.log(`step ${index} end`)
//   })
// }

// const array = [1, 2, 3]

// // getURLs()

// getAllForEach(array)
// console.log("end of  script")