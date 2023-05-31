// globals.js
let numPlayer = 0;
let google_id = "";
let turn_NAME ="";
let sentence ="";
let friends_name_and_sentence = [];
module.exports = {
    getNumPlayer: () => numPlayer,
    getTurnName: () => turn_NAME,
    getFriendsNamesAndSentence:()=>friends_name_and_sentence,
    getSentences: () => sentence,
    setNumPlayer: (value) => {
        numPlayer = value;
    },
    getIdPlayer: () => google_id,
    setIdPlayer: (value) => {
        google_id = value;
    },
    setTurnName: (value) => {
        turn_NAME = value;
    },
    setSentences: (value) => {
        sentence = value;
    },
    setFriendNameAndSentence: (value) => {
        friends_name_and_sentence = value;
    }

};
