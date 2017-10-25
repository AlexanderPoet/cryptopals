const buffer = require('buffer');
const Promise = require('bluebird');
const path = `${process.env.PWD}/resources/test.txt`; //hardcoded text location for default testing;
const readFileAsync = Promise.promisify(require('fs').readFile);

const hexTo64 = string => Buffer.from(string, 'hex').toString('base64');

const fixedXOR = string => {
  let a = Buffer.from(string, 'hex');
  return (string) => {
    let b = Buffer.from(string, 'hex');
    const buf = Buffer.alloc(b.length);
    for (const key of b.keys()) {
      buf[key] = a[key] ^ b[key];
    }
    return buf.toString(); // made to return string for easy testing
  }
}

const singleByteXOR = string => {
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

  let finalChoice;
  let length;
  let _string;

  for (let code = 0; code < 257; code++) {
    const buf = Buffer.from(string, 'hex');
    const max = { code: 0, count: 0 };
    let spy = [];
    let _string;
    length = buf.length;
    
    for (const key of buf.keys()) {
      buf[key] = spy[key] = buf[key] ^ code;
    }
    _string = buf.toString();

    spy = spy.reduce((rec, val, index) => { // count occurences of chars
      rec[val] = rec[val] ? rec[val] + 1 : 1;
      if (max.count < rec[val] && val !== 32) {
        max.code = val;
        max.count = rec[val];
      }
      return rec;
    },{});
    
    if (mostPopular[max.code]){ // terrible filter
      if (allEnglish(_string)) {
        finalists.push({
          char: String.fromCharCode(code),
          string: _string,
          count: max.count,
          spaces: spy[32]
        });
      }
    }
  }

  finalists.forEach(finalist => {
    if (!finalChoice) {
      finalChoice = finalist;
      return;
    }
    finalChoice = finalChoice.spaces < finalist.spaces ? finalist : finalChoice;
  });
  return finalChoice || [];
};

const detectSingleCharXOR = (filepath=path) => 
  readFileAsync(filepath)
  .then(data =>
    data.toString()
    .split('\n')
    .map(singleByteXOR)
    .filter(ele => ele.spaces)[0]
  )
  .catch(err => console.log('Errorrrr,', err));
;

const allEnglish = str => {
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

const repeatingKeyXOR = (text, key='ICE') => {
  if (!text) {
    text = `Burning 'em, if you ain't quick and nimble\n` +
      `I go crazy when I hear a cymbal`;
  }
  let keyIndex = 0;
  let store = [];
  let b;
  let tB = Buffer.from(text);
  let kB = Buffer.from(key);
  for (let i = 0; i < tB.length; i++) {
    let xor = tB[i] ^ kB[keyIndex]
    tB[i] = xor;
    keyIndex++;
    keyIndex = keyIndex > key.length - 1 ? 0 : keyIndex;
  }
  return tB.toString('hex');
}

module.exports = {
  hexTo64,
  fixedXOR,
  singleByteXOR,
  detectSingleCharXOR,
  repeatingKeyXOR
};