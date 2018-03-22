const functions = require('firebase-functions');
let admin = require("firebase-admin");
let serviceAccount = require("./serviceAccountKey.json");
const Firestore = require('@google-cloud/firestore');

const http = require('http')
const hostname = '127.0.0.1';
const port = 3000;


const firestore = new Firestore({
    projectId: 'pami-16c0f',
    keyFilename: './serviceAccountKey.json',
});

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pami-16c0f.firebaseio.com"
});

const cors = require('cors')({
    origin: true
});

exports.helloWorld = functions.https.onRequest((request, response) => {

        cors(request, response, () => {

            if (request.method == 'POST') {

                employee = JSON.parse(request.body);

                let email = employee.email;
                let password = employee.password;
                let companyId = employee.companyId;

                let role = employee.role;

                admin.auth().createUser({
                    email: email,
                    emailVerified: false,
                    password: password,
                    disabled: false
                })
                    .then(userRecord => {
                        // this.addCompany = function (companyId, companyName, uid) {

                        console.log(userRecord.uid + ' ' + " " + companyId + " " + role)
                        const userDocument = firestore.doc('users/' + userRecord.uid).set(
                            employee
                            //     {
                            //     role: role,
                            //     companyName: companyName,
                            // }
                        ).catch(err => {
                            console.log('22' + err)
                        })

                        console.log('add company' + companyId);
                        const document = firestore.doc('companies/' + companyId);
                        document.set({
                            // name: companyName,
                            companyId: companyId
                        }).catch(err => {
                            console.log('11' + err)
                        });

                        console.log('lllllllllllllllllllllllllllllll' + role + ' ' + companyId)
                        firestore.doc('companies/' + companyId).collection(role + 's').doc(userRecord.uid).set(
                            employee
                        ).catch(err => {
                            console.log('33' + err)
                        })

                    })
                    .catch(function (error) {
                        response.send('errrrrror')
                    });
            }

        });

    }
);

exports.createEmployee = functions.https.onRequest((request, response)=>{

    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

        if (request.method === 'GET') {
            let email = request.query.email;
            let password = request.query.password;

                admin.auth().createUser({
                    email: email,
                    emailVerified: false,
                    password: password,
                    disabled: false
                }).then(succes => {
                    response.send(succes.uid)

                }).catch(er => {
                    response.send(er)
                })
        }
});

exports.createCompany = functions.https.onRequest((request,response)=>{
    const document = firestore.collection("companies");
console.log("create comp")
    cors(request,response,()=>{
        console.log("create comp cors")

    document.add({
        name: "ble ble"
    }).then(suc=>{
        reponse.send("succes")
        }

    ).catch(err => {
        response.send("error")
    });

    })

})


exports.shiftChangeListener = functions.firestore.document('data/lastAdded').onWrite((event) => {
    console.log('called')

    let ss = event.data.data();

    console.log('exists')
    employeeId = ss.employeeId;
    dateKey = ss.dateKey;
    year = ss.year;
    month = ss.month;
    companyId = ss.companyId;

    console.log(employeeId + '' + dateKey);

    return firestore.collection('users').doc(employeeId).collection('shifts').where('startTime.year', '==', year)
        .where('startTime.month', '==', month).onSnapshot(shifts => {

            console.log('111')
            let obHours = 0;
            let obNightHours = 0;
            let obMoney = 0;
            let obNightMoney = 0;
            let duration = 0;
            let total = 0;
            let employeeSalary = 0;
            let year = 0;
            let month = 0;
            console.log('2222')
            shifts.forEach(shift => {
                let s = shift.data();
                obHours = obHours + s.OBhours;
                obNightHours = obNightHours + s.OBnattHours;
                obMoney = obMoney + s.OBmoney;
                obNightMoney = obNightMoney + s.OBnattMoney;
                duration = duration + s.duration;
                employeeSalary = s.employeeSalary;
                total = total + duration * employeeSalary + obMoney + obNightMoney;
                year = s.startTime.year;
                month = s.startTime.month;
            })
            console.log('3333')


            firestore.collection('users').doc(employeeId).collection('salaries').doc(dateKey).set({
                obHours: obHours,
                obNightHours: obNightHours,
                obMoney: obMoney,
                obNightMoney: obNightMoney,
                duration: duration,
                total: total,
                employeeSalary: employeeSalary,
                employeeId: employeeId,
                dateKey: dateKey,
                year: year,
                month: month
            }).then(succ => {
                return firestore.collection('companies').doc(companyId).collection('salaries').doc(dateKey + employeeId).set({
                    obHours: obHours,
                    obNightHours: obNightHours,
                    obMoney: obMoney,
                    obNightMoney: obNightMoney,
                    duration: duration,
                    total: total,
                    employeeSalary: employeeSalary,
                    employeeId: employeeId,
                    dateKey: Number.parseInt(dateKey),
                    year: year,
                    month: month
                }).then(succ => {
                    console.log('added2' + succ)

                }).catch(err => {
                    console.log('err2' + err)

                });
            })
        })
});
