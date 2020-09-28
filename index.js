const express = require('express');
var path = require('path');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use('/scripts', express.static(__dirname + '/node_modules/'));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));