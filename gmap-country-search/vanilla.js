document.querySelectorAll('.Nv2PK.THOPZb').forEach(function(elem){
  const output = {}
  
  output.name = elem.ariaLabel

  let activity = elem.querySelector(".Z8fK3b .W4Efsd .W4Efsd:nth-child(2) span:first-child jsl span:nth-child(2)")
  if (activity !== null) {
    output.activity = activity.textContent.replace(/,/g, ".")
  } else {
    output.activity = "null"
  }

  let company_address = elem.querySelector(".Z8fK3b .W4Efsd .W4Efsd:nth-child(2) span:nth-child(2) jsl span:nth-child(2)")
  if (company_address !== null) {
    output.company_address = company_address.textContent.replace(/,/g, ".")
  } else {
    output.company_address = "null"
  }

  let phone = elem.querySelector(".Z8fK3b .W4Efsd .W4Efsd:nth-child(3) span:nth-child(2) jsl span:nth-child(2)")
  if (phone !== null) {
    output.phone = phone.textContent.replace(/,/g, ".")
  } else {
    output.phone = "null"
  }

  let site_link = elem.querySelector(".Rwjeuc a")
  if (site_link !== null) {
    output.site_link = site_link.href
  } else {
    output.site_link = "null"
  }

  console.log(output)
})