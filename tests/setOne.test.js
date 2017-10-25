const { setOne } = require(`${process.env.PWD}/sets`);
const hexSample = '49276d206b696c6c696e6720796f757220627261696'+
  'e206c696b65206120706f69736f6e6f7573206d757368726f6f6d';
const base64Answer = 'SSdtIGtpbGxpbmcgeW91ciBicmFpbiBsaWtlIGEgcG9p'+
  'c29ub3VzIG11c2hyb29t';
const fixedStringOne = '1c0111001f010100061a024b53535009181c';
const fixedStringTwo = '686974207468652062756c6c277320657965';
const fixedStringAnswer = Buffer.from('746865206b696420646f6e277420706c6179', 'hex').toString();
const singleX = '1b37373331363f78151b7f2b783431333d78397828372d363c78373e783a393b3736';
const repeatAnswer = `0b3637272a2b2e63622c2e69692a23693a2a3c6324202d623d63343c2a26226324272765272` +
`a282b2f20430a652e2c652a3124333a653e2b2027630c692b20283165286326302e27282f`;
const baconFile = `${process.env.PWD}/resources/bacon.txt`;
const wu = 'Cooking MC\'s like a pound of bacon';


test('hexTo64 can return the base64 string of init example', () => {
  expect(setOne.hexTo64(hexSample)).toBe(base64Answer);
});


test('fixedXOR return function called with same buffer produces nothing', () => {
  const compareBufferTo = setOne.fixedXOR(fixedStringOne);
  expect(compareBufferTo(fixedStringOne)).toMatch('');
});

test('fixedXOR can process the buffers from strings example', () => {
  const compareBufferTo = setOne.fixedXOR(fixedStringOne);
  expect(compareBufferTo(fixedStringTwo)).toBe(fixedStringAnswer);
});

test('fixedXOR can compare multiple buffers to same target with subsequent calls', () => {
  const compareBufferTo = setOne.fixedXOR(fixedStringOne);
  expect(compareBufferTo(fixedStringOne)).toBeDefined();
});


test('singleByteXOR will find the key and decrypt example string', () => {
  let attempt = setOne.singleByteXOR(singleX);
  expect(attempt).toHaveProperty('char', 'X');
  expect(attempt).toHaveProperty('string', wu);
});

test('singleByteXOR can be used as mapping function', () => {
  let attempt = [singleX,singleX].map(setOne.singleByteXOR);
  expect(attempt).toHaveLength(2);
});


test('detectSingleCharXOR detects the secret in built in text', () => {
  setOne.detectSingleCharXOR()
  .then(success => 
    expect(success.string).toBe('Now that the party is jumping\n')
  )
});

test('detectSingleCharXOR detects a secret in supplied filepath', () => {
  setOne.detectSingleCharXOR(baconFile)
  .then(success => 
    expect(success.string).toBe(wu)
  )
});


test('repeatingKeyXOR will xor with any key size', () => {
  expect(setOne.repeatingKeyXOR('testing testing', 'FIRE')).toBeDefined();
});

test('repeatingKeyXOR sample data with sample key "ICE" working', () => {
  expect(setOne.repeatingKeyXOR()).toBe(repeatAnswer);
});

