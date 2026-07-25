const fs = require('fs');
const filePath = 'c:\\Users\\JOHN HAROLD SANTOS\\OneDrive\\Desktop\\CAPSTONE 2 - DOMMUNITY CODE\\DOMMUNITY-main\\src\\renderer\\src\\modules\\admin\\AdminDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const startFormMarker = '<div className="w-full">\n                    {/* Right Column: Donation batch compiler */}';
const endFormMarker = '</form>\n                    </div>\n                  </div>';

const startIdx = content.indexOf(startFormMarker);
console.log("startIdx:", startIdx);
console.log("start excerpt:", content.slice(startIdx, startIdx + 200));

const endIdx = content.indexOf(endFormMarker, startIdx);
console.log("endIdx:", endIdx);
console.log("end excerpt:", content.slice(endIdx - 100, endIdx + 100));
