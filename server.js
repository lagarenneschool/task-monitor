const express = require('express');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const moment = require('moment', 'moment-timezone');

const app = express();
app.use(cors());
app.use(express.json());

let db;

MongoClient.connect('', { useUnifiedTopology: true })
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
    const clientGracePeriodStart = req.body.gracePeriodStart;
    const clientGracePeriodEnd = req.body.gracePeriodEnd;  // receive gracePeriodEnd from request
    const gracePeriodEnded = req.body.gracePeriodEnded;

    console.log(`Received status: ${status} from user: ${username}`);

    try {
        const usersCollection = db.collection('users');
        let user = await usersCollection.findOne({username: username});
        const currentTime = moment().toDate();

        if (!user) {
            user = {username: username, status: status, gracePeriodStart: clientGracePeriodStart || currentTime, gracePeriodEnd: null};
            if (status === 'offtask') {
                user.status = 'grace';
                user.gracePeriodEnd = moment(user.gracePeriodStart).add(2, 'minutes').toDate();
            }
            await usersCollection.insertOne(user);
        } else {
            if (status === 'offtask') {
                if (!user.lastGracePeriodEnd || moment().isAfter(moment(user.lastGracePeriodEnd).add(1, 'hour'))) {
                    user.status = 'grace';
                    user.gracePeriodStart = clientGracePeriodStart || currentTime;
                    user.gracePeriodEnd = moment(user.gracePeriodStart).add(2, 'minutes').toDate();
                } else {
                    user.status = 'offtask';
                }
            } else if (status === 'grace') {
                if (moment().isBefore(user.gracePeriodEnd)) {
                    user.status = 'grace';
                } else {
                    user.status = 'offtask';
                }
            } else if (status === 'ontask') {
                user.status = 'ontask';
                user.gracePeriodEnd = null;
            }

if (gracePeriodEnded) {
                user.lastGracePeriodEnd = clientGracePeriodEnd || currentTime;  // use client provided gracePeriodEnd
                user.gracePeriodEnd = clientGracePeriodEnd || currentTime;
            
                // Check if current time is still within the grace period, given the updated gracePeriodEnd
                if (moment().isBefore(user.gracePeriodEnd)) {
                    user.status = 'grace';
                } else {
                    user.status = 'offtask';
                }
            }                    
        } 

        await usersCollection.updateOne({username: username}, {$set: user}, {returnOriginal: false});
        
        user = await usersCollection.findOne({username: username});

        console.log(`User after update: ${JSON.stringify(user)}`);

        console.log(`User: ${username} is Status: ${user.status} on ${m}`);
        res.json({status: user.status, message: 'Status updated'});
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error'});
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
