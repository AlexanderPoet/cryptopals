const buffer = require('buffer');
const Promise = require('bluebird');
const testText = `${process.env.PWD}/resources/test.txt`; //hardcoded text location for default testing;
const breakThis = `${process.env.PWD}/resources/setOneCh6.txt`;
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
  const english_freq = [
    0.08167, 0.01492, 0.02782, 0.04253, 0.12702, 0.02228, 0.02015,  // A-G
    0.06094, 0.06966, 0.00153, 0.00772, 0.04025, 0.02406, 0.06749,  // H-N
    0.07507, 0.01929, 0.00095, 0.05987, 0.06327, 0.09056, 0.02758,  // O-U
    0.00978, 0.02360, 0.00150, 0.01974, 0.00074                     // V-Z
  ];

  let finalChoice;
  let final;
  let minScore = Infinity;
  let _string;

  for (let code = 0; code < 257; code++) {
    const buf = Buffer.from(string, 'hex');
    const max = { code: 0, count: 0 };
    let _string;
    let spaces;
    
    for (const key of buf.keys()) {
      buf[key] = buf[key] ^ code;
    }
    
    _string = buf.toString();

    const score = buffer => { // http://en.algoritmy.net/article/40379/Letter-frequency-English
      let store = Array.from({length: 27}, (v, i) => 0);
      let val;
      spaces = store[26]
      let ignored = 0;
      for (let i = 0; i < buffer.length; i++) {
        val = buf[i];
        if (val >= 65 && val <= 90) { store[val - 65]++ }
        else if (val >= 97 && val <= 122) { store[val - 97]++; }  // lowercase a-z
        else if (val === 32) { spaces++; }
        else if (val >= 32 && val <= 126) { ignored++; }      // numbers and punct.
        else if (val == 9 || val == 10 || val == 13) { ignored++; }  // TAB, CR, LF
        else { return Infinity; }
      }
      let chiSq = 0;
      let len = buffer.length - ignored;
    
      for (var i = 0; i < 26; i++) {
          let observed = store[i] || 0;
          let expected = len * english_freq[i];
          let difference = observed - expected;
          chiSq += difference*difference / expected;
      }
        return spaces ? chiSq : Infinity;
    };

    let chi = score(buf);

    if (chi < minScore) {
      final = { string: _string, encodingChar: code, spaces };
      minScore = chi;
    }
  }
  return final || false;
};

const detectSingleCharXOR = (filepath=testText) => 
  readFileAsync(filepath)
  .then(data =>
    data.toString()
    .split('\n')
    .map(singleByteXOR)
    .filter(ele => ele)[0]
  )
  .catch(err => console.log('Errorrrr,', err));
;

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

const hammingDistance = (word1, word2) => { //there has to be a beter way to do this
  let distance = 0;
  for (let i = 0; i < word1.length; i++) {
    let xor = Math.abs(word1[i].charCodeAt(0) - word2[i].charCodeAt(0))
    while (xor > 1) {
      let twos = 2;
      let prev;
      while (twos < xor) {
        prev = twos;
        twos *= 2;
      }
      distance++;
      xor -= prev;
      twos = 2;
    }
    distance = xor === 1 ? distance + 1: distance;
  }
  return distance;
}

const breakingRKXOR = code64 => {
  let poss = [];
  for (let keySize = 2; keySize < 41; keySize++) {
    let distance =
      hammingDistance(
        hexTo64(code64.substring(0, keySize - 1)),
        hexTo64(code64.substring(keySize, (keySize * 2) - 1))
      ) / keySize;
      poss.push([keySize, distance])
  }
  let hi = {};
  return poss.sort((a,b) => a[1] > b[1] ? 1 : -1 )
    .slice(0,3) // number of top keylengths to try
    .map(tuple => {
    const brokenUp = [];
    const k = tuple[0];
    for (let i = 0; i < code64.length; i+=k) {
      brokenUp.push(code64.substring(i, (i+k)));
    }
    return brokenUp;
  }).reduce((hi, city) => {
    let size = city[0].length;
    hi[size] = hi[size] || {};
    for (let i = 0; i < size; i++) {
      hi[size][i] = city.map(block => block[i]).join('');
      hi[size].sbxor = hi[size].sbxor || {};
      hi[size].sbxor[i] = singleByteXOR(hi[size][i], null, null, true);
    }
    return hi;
  },{});
}
// let A = readFileAsync(breakThis).then(success => {
//   let boo = Buffer.from(success.toString(), 'base64').toString('hex');
//   let B = breakingRKXOR(boo);
//   Object.keys(B).forEach(x => {
//     let D = '';
//     Object.keys(B[x].sbxor).forEach(y => D+=B[x].sbxor[y].char);
//     console.log(repeatingKeyXOR(boo, D))
//     //console.log(Buffer.from(repeatingKeyXOR(boo, D), 'hex').toString('ascii'))
//   });
// }).catch(e => console.log(e))



module.exports = {
  hexTo64,
  fixedXOR,
  singleByteXOR,
  detectSingleCharXOR,
  repeatingKeyXOR,
  breakingRKXOR
};
