const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function testUpload() {
  try {
    const formData = new FormData();
    // create a dummy pdf file
    fs.writeFileSync('dummy.pdf', '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    formData.append('file', fs.createReadStream('dummy.pdf'));
    formData.append('category', 'items');
    
    // We don't have token, but let's see if we get 401 or 400
    const res = await axios.post('https://api-dev-inventory.softmate.my.id/v1/file/upload', formData, {
      headers: formData.getHeaders()
    });
    console.log("Success:", res.data);
  } catch (err) {
    if (err.response) {
      console.error("Backend Error Status:", err.response.status);
      console.error("Backend Error Data:", err.response.data);
    } else {
      console.error("Error:", err.message);
    }
  }
}
testUpload();
