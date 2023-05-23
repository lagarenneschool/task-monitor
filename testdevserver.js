const express = require('express');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const moment = require('moment', 'moment-timezone');
import { subHours, isAfter } from 'date-fns';

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
            if (status === 'offtask') {
                let gracePeriodUsedNow = (moment().valueOf() - new Date(user.gracePeriodStart).getTime()) / (1000*60);
                if (user.status === "ontask") {
                    // Check if an hour has passed since the last grace period ended and reset gracePeriodUsed
                    if (user.lastGracePeriodEnd && isAfter(subHours(new Date(), 1), user.lastGracePeriodEnd)) {
                        user.gracePeriodUsed = 0;
                        user.lastGracePeriodEnd = null;
                    }

                    // Then proceed with the existing check
                    if(user.gracePeriodUsed < 2) {
                        user.status = "grace";
                        user.gracePeriodStart = moment().toISOString();
                    } else {
                        user.status = "offtask";
                    }
                } else if (user.status === "grace") {
                    if(user.gracePeriodUsed + gracePeriodUsedNow >= 2) {
                        user.status = "offtask";
                        user.lastGracePeriodEnd = user.gracePeriodStart;
                        user.gracePeriodUsed += gracePeriodUsedNow; // add grace period used now
                        user.gracePeriodStart = null;
                    }
                } 
                await usersCollection.updateOne({username: username}, { $set: user});
            } else if (status === 'ontask') {
                if (user.status === "grace") {
                    let gracePeriodUsedNow = (moment().valueOf() - new Date(user.gracePeriodStart).getTime()) / (1000*60);
                    user.gracePeriodUsed += gracePeriodUsedNow;
                    user.lastGracePeriodEnd = moment().toISOString();
                    user.gracePeriodStart = null;
                }
                user.status = "ontask";
                await usersCollection.updateOne({username: username}, { $set: user});
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
            if (moment().subtract(10, 'minutes').isAfter(user.lastGracePeriodEnd)) {
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
