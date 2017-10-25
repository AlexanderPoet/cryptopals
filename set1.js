const buffer = require('buffer');
const hexTo64 = string => Buffer.from(string, 'hex').toString('base64');

const fixedXOR = (string) => {
  let a = Buffer.from(string, 'hex');
  return (string) => {
    let b = Buffer.from(string, 'hex');
    const buf = Buffer.alloc(b.length);
    console.log(b)
    console.log(a)
    for (const key of b.keys()) {
      //console.log(a[key], b[key]);
      buf[key] = a[key] ^ b[key];
      
    }
    return buf;
  }
}

const sbXOR = string => { // a single english character to be more specific
  const finalists = [];
  const mostPopular = {
    101: 1,
    97: 2,
    105: 3,
    114: 4,
    111: 5,
    116: 6,
    110: 7,
    115: 8,
    108: 9,
    99: 10,
    100: 11
  }
  const finalFilterCheck = str => {
    let containsAllEnglish = true;
    for (let i = 0; i < str.length; i++) {
      let cc = str[i].charCodeAt(0);
      containsAllEnglish = (31 < cc && cc < 127) || cc === 10; // LF bug
      if (!containsAllEnglish) {
          return false;
      }
    }
    return true;
  };
  let length;
  let _string;
  for (let code = 0; code < 257; code++) {//127
    const buf = Buffer.from(string, 'hex');
    const max = { code: 0, count: 0 };
    let spy = [];
    let _string;
    length = buf.length;
    
    for (const key of buf.keys()) {
      buf[key] = spy[key] = buf[key] ^ code;
    }
    _string = buf.toString();

    spy = spy.reduce((rec, val, index) => {
      rec[val] = rec[val] ? rec[val] + 1 : 1;
      if (max.count < rec[val] && val !== 32) {
        max.code = val;
        max.count = rec[val];
      }
      return rec;
    },{});
    
    if (mostPopular[max.code]){ // terrible filter
      if (finalFilterCheck(_string)) {
        finalists.push({ char: String.fromCharCode(max.code), string: _string, count: max.count, spaces: spy[32]});// human version
      }
    }
  }
  let finalChoice;
  finalists.forEach(finalist => {
    if (!finalChoice) {
      finalChoice = finalist;
      return;
    }
    finalChoice = finalChoice.spaces < finalist.spaces ? finalist : finalChoice;
  });
  return finalChoice || [];
};

const fs = require('fs');

const detectSingleCharXOR = (filepath='test.txt', cb) => {
  fs.readFile(filepath, (err, data) => {
    if (err) {
      console.log(err, 'ahhhhh');
    } 
    let secret =
      data.toString()
      .split('\n')
      .map(sbXOR)
      .filter(ele => ele.spaces)[0].string;
    if (!cb) {
      console.log(secret);
      return
    }
    cb(secret);
  });
}

detectSingleCharXOR();