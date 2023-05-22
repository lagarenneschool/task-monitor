const express = require('express');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const moment = require('moment', 'moment-timezone');

const app = express();
app.use(cors());
app.use(express.json());

let db;

MongoClient.connect('mongodb+srv://mat:mathieu@lgtm.vgtn6eu.mongodb.net/?retryWrites=true&w=majority', { useUnifiedTopology: true })
  .then(client => {
    console.log('Connected to MongoDB Database');
    console.log(new Date());
    db = client.db('lgtm');
  })
  .catch(error => console.error(error));

app.post('/:m-status', async (req, res) => {
    const username = req.body.username;
    const status = req.body.status;
    const m = req.params.m;

    console.log(`Received status: ${status} from user: ${username}`);

    try {
        const usersCollection = db.collection('users');
        let user = await usersCollection.findOne({username: username});

        if (!user) {
            user = {
                username: username, 
                status: status, 
                gracePeriodStart: null, 
                lastGracePeriodEnd: null,
                gracePeriodUsed: 0
            };
            await usersCollection.insertOne(user);
        } else {
            // user is going off task, start or continue the grace period
            if (status === 'offtask' && user.status !== 'offtask') {
                if (user.status === 'ontask' || user.status === 'grace') {
                    let gracePeriodUsed = 0;
                    if (user.gracePeriodStart) {
                        gracePeriodUsed = (moment().valueOf() - new Date(user.gracePeriodStart).getTime()) / (1000*60) + user.gracePeriodUsed;
                    }
            
                    let newStatus;
                    if (gracePeriodUsed > 2) {
                        // if more than max grace period is used, user should be off task
                        newStatus = 'offtask';
                        gracePeriodUsed = 2;
                    } else {
                        // start or continue the grace period
                        newStatus = 'grace';
                    }
            
                    await usersCollection.updateOne({username: username}, { $set: { 
                        status: newStatus, 
                        gracePeriodStart: moment().toISOString(), 
                        gracePeriodUsed: gracePeriodUsed 
                    }});
                }
            }
            // user is going back on task, end the grace period
            else if (status === 'ontask' && (user.status === 'offtask' || user.status === 'grace')) {
                let gracePeriodUsed = 0;
                if (user.gracePeriodStart) {
                    gracePeriodUsed = (moment().valueOf() - new Date(user.gracePeriodStart).getTime()) / (1000*60) + user.gracePeriodUsed;
                }

                await usersCollection.updateOne({username: username}, { $set: { 
                    status: 'ontask', 
                    gracePeriodStart: null, 
                    gracePeriodUsed: gracePeriodUsed 
                }});
            }
        }

        user = await usersCollection.findOne({username: username});
        console.log(`User: ${user.username} is Status: ${user.status} on ${m}`);
        res.send(user);

    } catch (err) {
        console.log(err);
        res.status(500).send({message: 'An error occurred while processing your request.'});
    }
});

app.get('/:m-status', async (req, res) => {
    const m = req.params.m;

    try {
        const usersCollection = db.collection('users');
        const users = await usersCollection.find().toArray();
        for (let user of users) {
            if (moment().subtract(10, 'minutes').isAfter(user.gracePeriodEnd)) {
                user.status = 'offline';
                await usersCollection.updateOne({username: user.username}, {$set: {status: 'offline'}});
            }
        }
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error'});
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
