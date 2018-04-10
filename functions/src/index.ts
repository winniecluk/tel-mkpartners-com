import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// methods for twilio node package are poorly documented; easier to build own xml string w/ other package
// import * as twilio from 'twilio';

import * as builder from 'xmlbuilder';

admin.initializeApp();

// main object that contains object and keys
// const selfUrl: string = 'https://us-central1-tel-mkpartners-com.cloudfunctions.net/receiveCall';
const domainName: string = '@mkpartnerswinnie.sip.us1.twilio.com';
const xmlHeader: string = '<?xml version="1.0" encoding="UTF-8"?>';

// req.query.round currently zero-indexed in twilio interface
// data structure not decided
const numberPool: any = [
    [{sip: `727${domainName}`, number: ''}]
    , [{sip: `729${domainName}`}]
]

// do I really need a map?
// const numberMap: object = new Map([
//     [727, `727${domainName}`]
//     [728, `728${domainName}`]
// ]);

// method to update the numbers in sip domain


exports.recordCallDetails = functions.https.onRequest((req, res) => {
    console.log('recording call details');
    recordEndCall(req);

    // record here
    // DialCallStatus
    // CallerState
    //  CallerZip
    //
});

function recordEndCall(req){
    // const callerNumber = req.body.Caller.substring(1);
    const date = new Date().toISOString().split('T')[0];
    admin.firestore().collection('calls').doc(date).collection('calls').doc(req.query.Id)
    // .collection(callerNumber).doc(req.query.docId)
    .update({
        callEndTime: admin.firestore.FieldValue.serverTimestamp(),
        callStatus: 'Completed call.'
    })
    .then(() => {
        console.log("Document updated!");
    })
    .catch(error => {
        console.error("Error updating document: ", error);
    });
}

function recordStartCall(body){
    const date = new Date().toISOString().split('T')[0];
    const collectionRef = admin.firestore().collection('calls').doc(date).collection('calls');
    // .doc(date).collection(callerNumber);

    return collectionRef.add({
        callStartTime: admin.firestore.FieldValue.serverTimestamp(),
        callStatus: 'Did not pick up',
        number: body.From
    })
    .then(savedDoc => {
        console.log("Document written with ID: ", savedDoc.id);
        return savedDoc.id;
    })
    .catch(error => {
        console.error("Error adding document: ", error);
        return error;
    });
}

exports.receiveCall = functions.https.onRequest((req, res) => {
    let xmlStr = xmlHeader;
    const xmlBuilder = builder.create('Response');
    // const roundNum = req.query.round;
    //
    // if (req.query.round){
        recordStartCall(req.body)
        .then(docRefId => {
            buildXmlStr(xmlBuilder, docRefId, 'There are no available numbers in this pool.').then(result => {
                xmlStr += result;
                xmlStr = xmlStr.replace('<?xml version="1.0"?>', '');
                console.log('this is the xml string');
                console.log(xmlStr);
                res.send(xmlStr);
                return 'OK';
            }).catch(err => {
                console.log(err);
            })
        })
        .catch(error => {
            console.log(error);
        });
    // }
    // else {
    //     buildCustomMessage(xmlBuilder, 'woman', 'Missing query params round.').then(result => {
    //         console.log(result);
    //         xmlStr += result.end();
    //         xmlStr = xmlStr.replace('<?xml version="1.0"?>', '');
    //         console.log('this is the xml string');
    //         console.log(xmlStr);
    //         res.send(xmlStr);
    //         return 'OK';
    //     }).catch(err => {
    //         console.log(err);
    //     })
    // }

});


async function buildXmlStr(xmlBuilder: any, docRefId: string, customMessage: string){
    const xmlPromise = new Promise((resolve, reject) => {
        for (let i = 0; i < numberPool.length; i++){
            const dialElement = xmlBuilder.ele('Dial');
            dialElement.att('action', 'https://us-central1-tel-mkpartners-com.cloudfunctions.net/recordCallDetails?docId=' + docRefId);
            dialElement.att('method', 'POST');
            dialElement.att('timeout', 20);
            for (let j = 0; j < numberPool[i].length; j++){
                if (numberPool[i][j]['number']){
                    dialElement.ele('Number',numberPool[i][j]['number']);
                }
                if (numberPool[i][j]['sip']){
                    dialElement.ele('Sip',numberPool[i][j]['sip']);
                }
            }
        }
        resolve(xmlBuilder.end());
    });
    let result = await xmlPromise;
    return result;
}

// async function buildXmlStr(xmlBuilder: any, roundNum: number, customMessage: string){
//     if (numberPool[roundNum]
//         && numberPool[roundNum].length > 0){
//         const xmlPromise = new Promise((resolve, reject) => {
//             let dialElement = xmlBuilder.ele('Dial');
//             // dialElement.att('action', selfUrl + '?round=' + (roundNum + 1).toString() );
//             // dialElement.att('method', 'POST');
//             for (let i = 0; i < numberPool[roundNum].length; i++){
//                 if (numberPool[roundNum][i]['number']){
//                     dialElement.ele('Number',numberPool[roundNum][i]['number']);
//                 }
//                 if (numberPool[roundNum][i]['sip']){
//                     dialElement.ele('Sip',numberPool[roundNum][i]['sip']);
//                 }
//             }
//             resolve(xmlBuilder);
//         });
//         const result = await xmlPromise;
//         return result;
//     } else {
//         return buildCustomMessage(xmlBuilder, 'woman', customMessage);
//     }
// }

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
//   CallSid: 'CASID',
//   To: '+18184235246',
//   CallerZip: '',
//   ToCountry: 'US',
//   ApiVersion: '2010-04-01',
//   CalledZip: '90014',
//   CalledCity: 'LOS ANGELES',
//   CallStatus: 'ringing',
//   From: '+13234773647',
//   AccountSid: 'ACSID',
//   CalledCountry: 'US',
//   CallerCity: '',
//   Caller: '+13234773647',
//   FromCountry: 'US',
//   ToCity: 'LOS ANGELES',
//   FromCity: '',
//   CalledState: 'CA',
//   FromZip: '',
//   FromState: 'CA' }
