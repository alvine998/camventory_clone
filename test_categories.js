const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testCategory(category, ext) {
  try {
    const formData = new FormData();
    const filename = 'dummy.' + ext;
    if (ext === 'pdf') {
      fs.writeFileSync(filename, '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    } else {
      fs.writeFileSync(filename, 'dummy_png_data'); // just a text file
    }
    
    formData.append('file', fs.createReadStream(filename));
    formData.append('category', category);
    
    await axios.post('https://api-dev-inventory.softmate.my.id/v1/file/upload', formData, {
      headers: formData.getHeaders()
    });
    console.log(`[PASS] category=${category}, ext=${ext}`);
  } catch (err) {
    if (err.response) {
      console.log(`[${err.response.status}] category=${category}, ext=${ext}: ${JSON.stringify(err.response.data)}`);
    } else {
      console.log(`[ERR] category=${category}, ext=${ext}: ${err.message}`);
    }
  }
}

async function run() {
  await testCategory('items', 'png');
  await testCategory('items', 'pdf');
  await testCategory('checkout', 'pdf');
  await testCategory('document', 'pdf');
  await testCategory('customer_ktp', 'pdf');
}
run();
