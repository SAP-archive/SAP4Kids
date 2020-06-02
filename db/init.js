//
//    This script runs automatically during the CDS DEPLOY command
//    before the deployment occurs, so that we can copy in the data csv files
//    for local deployment
//
var fs = require("fs");

const dataFolder = "./db/csv";
const samplesFolder = "sampledata";

console.log("Init.js: " + JSON.stringify(process.env.CDS_ENV));
if (process.env.CDS_ENV == "development") {
  console.log("Copying csv files into data folder for import in development env");
  try {
    if (!fs.existsSync(dataFolder)) {
      fs.mkdirSync(dataFolder);
    }

    let aFiles = fs.readdirSync(samplesFolder);
    aFiles.forEach((file) => {
      if (file.endsWith(".csv")) {
        fs.createReadStream(samplesFolder + "/" + file).pipe(fs.createWriteStream(dataFolder + "/" + file));
      }
    });
  } catch (err) {
    console.error(err);
  }
} else {
  console.log("Production build, so remove csv files to prevent data import");
  try {
    if (fs.existsSync(dataFolder)) {
      let aFiles = fs.readdirSync(dataFolder);
      if (aFiles) {
        aFiles.forEach((file) => {
          fs.unlinkSync(dataFolder + "/" + file);
        });
      }
      fs.rmdirSync(dataFolder);
    }
  } catch (err) {
    console.error(err);
  }
}
