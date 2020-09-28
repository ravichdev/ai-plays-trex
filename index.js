const express = require("express");
const path = require("path");
const opn = require("opn");
const app = express();
const port = 3000;

app.use(express.static("public"));
app.use("/scripts", express.static(__dirname + "/node_modules/"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
  opn(`http://localhost:${port}`);
});
