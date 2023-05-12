// globals.js
let numPlayer = 0;
let google_id = "";
module.exports = {
    getNumPlayer: () => numPlayer,
    setNumPlayer: (value) => {
        numPlayer = value;
    },
    getIdPlayer: () => google_id,
    setIdPlayer: (value) => {
        google_id = value;
    },
};
