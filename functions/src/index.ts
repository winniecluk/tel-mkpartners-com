import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// methods for twilio node package are poorly documented; easier to build own xml string w/ other package
// import * as twilio from 'twilio';

import * as builder from 'xmlbuilder';

admin.initializeApp();

// main object that contains object and keys
const domainName: string = '@mkpartnerswinnie.sip.us1.twilio.com';
const xmlHeader: string = '<?xml version="1.0" encoding="UTF-8"?>';

// req.query.round currently zero-indexed in twilio interface
// data structure not decided
const numberPool: object = [
    [{extension: 727}, {extension: 728}]
    , [{extension: 729}]
    , []
]

// do I really need a map?
// const numberMap: object = new Map([
//     [727, `727${domainName}`]
//     [728, `728${domainName}`]
// ]);

// method to update the numbers in sip domain



exports.receiveCall = functions.https.onRequest((req, res) => {
    let xmlStr = xmlHeader;
    let xmlBuilder = builder.create('Response');
    const roundNum = req.query.round;

    if (req.query.round){
        buildXmlStr(xmlBuilder, parseInt(roundNum), 'There are no available numbers in this pool.').then(result => {
            xmlStr += result.end();
            xmlStr = xmlStr.replace('<?xml version="1.0"?>', '');
            console.log('this is the xml string');
            console.log(xmlStr);
            res.send(xmlStr);
            return 'OK';
        }).catch(err => {
            console.log(err);
        })
    }
    else {
        buildCustomMessage(xmlBuilder, 'woman', 'Missing query params round.').then(result => {
            xmlStr += result.end();
            xmlStr = xmlStr.replace('<?xml version="1.0"?>', '');
            console.log('this is the xml string');
            console.log(xmlStr);
            res.send(xmlStr);
            return 'OK';
        }).catch(err => {
            console.log(err);
        })
    }

});

async function buildXmlStr(xmlBuilder: any, roundNum: number, customMessage: string){
    if (numberPool[roundNum]
        && numberPool[roundNum].length > 0){
        const xmlPromise = new Promise((resolve, reject) => {
            for (let i = 0; i < numberPool[roundNum].length; i++){
                xmlBuilder
                    .ele('Dial')
                        .ele('Sip', `${numberPool[roundNum][i]['extension']}${domainName}`);
            }
            resolve(xmlBuilder);
        });
        const result = await xmlPromise;
        return result;
    } else {
        return buildCustomMessage(xmlBuilder, 'woman', customMessage);
    }
}

function buildCustomMessage(xmlBuilder: any, voice: string, customMessage: string){
    xmlBuilder.ele('Say', {voice: voice}, customMessage)
    return xmlBuilder;
}


// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// example req.body in twilio request
// { Called: '+18184235246',
//   ToState: 'CA',
//   CallerCountry: 'US',
//   Direction: 'inbound',
//   CallerState: 'CA',
//   ToZip: '90014',
//   CallSid: 'CA8e1e0c23c6f3a2c6649edeaa9f0889d9',
//   To: '+18184235246',
//   CallerZip: '',
//   ToCountry: 'US',
//   ApiVersion: '2010-04-01',
//   CalledZip: '90014',
//   CalledCity: 'LOS ANGELES',
//   CallStatus: 'ringing',
//   From: '+13234773647',
//   AccountSid: 'AC97c8055012f3742758d5e86f6381a8b7',
//   CalledCountry: 'US',
//   CallerCity: '',
//   Caller: '+13234773647',
//   FromCountry: 'US',
//   ToCity: 'LOS ANGELES',
//   FromCity: '',
//   CalledState: 'CA',
//   FromZip: '',
//   FromState: 'CA' }
