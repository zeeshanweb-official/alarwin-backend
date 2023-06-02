const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const {pool} = require("../db");
const jwtGenerator = require("../utils/jwtGenerator");
const validInfo = require("../middleware/validinfo");
const authorization = require("../middleware/authorize");

const session = require('express-session')({
    secret: 'my-secret',
    resave: true,
    saveUninitialized: true
})

router.post("/resetpassword", validInfo, async (req, res) => {
    try {
        const body = JSON.parse(JSON.stringify(req.body))

        const {email, password, confirmpassword} = body;
        //step two: does the user already exist? throw error

        const user = await pool.query("SELECT * from salesforce.participant__c where email__c = $1 ", [email]);
        console.log('user' + user.rows.length);
        if(user.rows.length === 0){
            return res.status(401).send("User Doesn't Exist");
        }else{
            const salt = await bcrypt.genSalt(10);

            const bcryptPassword = await bcrypt.hash(password, salt);

            //step four: enter new user in db
            console.log('after bcrypt');

            const newParticipant = await pool.query
            ("Update INTO salesforce.participant__c (email__c, participant_password__c, member_since__c) Values ($1,$2,$3) RETURNING *", [email,  bcryptPassword, 2022]);
            //step five: generate token
            console.log('generating new participant');
            console.log('part id' + JSON.stringify(newParticipant.rows[0].externalid__c));
            const token = jwtGenerator(newParticipant.rows[0].externalid__c);

            return res.json({ token });
        }
        

    }catch(error){
        console.log(error.message);
        res.status(500).send("server error");
    }
})

router.post("/register", validInfo, async (req, res) =>{

    try {
        const body = JSON.parse(JSON.stringify(req.body))
        console.log(body);
        //step one: desturcture req.body (name email password)
        console.log('register req' + body);
        const {name, email, password} = body;
        console.log(name)
        //step two: does the user already exist? throw error

        const user = await pool.query("SELECT * from salesforce.participant__c where email__c = $1 ", [email]);
        console.log('user' + user.rows.length);
        if(user.rows.length != 0){
            return res.status(401).send("User Already Exists");
        }
        console.log('after rows');
        //step three: bcrypt user password
        const salt = await bcrypt.genSalt(10);

        const bcryptPassword = await bcrypt.hash(password, salt);

        //step four: enter new user in db
        console.log('after bcrypt');

        const newParticipant = await pool.query
        ("Insert INTO salesforce.participant__c (name, email__c, participant_password__c, member_since__c, externalid__c) Values ($1,$2,$3, $4, gen_random_uuid()) RETURNING *", [name, email,  bcryptPassword, 2021]);
        //step five: generate token
        console.log('generating new participant');
        console.log('part id' + JSON.stringify(newParticipant.rows[0].externalid__c));
        const token = jwtGenerator(newParticipant.rows[0].externalid__c);

        return res.json({ token });

    }catch(error){
        console.log(error.message);
        res.status(500).send("server error");
    }
});

//login route

router.post('/login', validInfo ,async (req, res) => {
    console.log('in login');
    try {

        // destructure req.body
        console.log('destructure' + JSON.stringify(req.body));

        const body = JSON.parse(JSON.stringify(req.body))

        const {email, password} = body;

        req.session.user = {
            username: 'OSK'
        };


        console.log('email' + email);
        //check if participant exists

        const participant = await pool.query("SELECT * from salesforce.participant__c Where email__c = $1", [
            email
        ]);

        if(participant.rows.length === 0){
            return res.status(401).send("Password or Email is incorrect");
        }

        //check if password is the same as database password


        const validPassword = await bcrypt.compare(password, participant.rows[0].participant_password__c);


        if(!validPassword) {
            return res.status(401).json("Password or Email is incorrect");
        }

        //give them JWT token

        const token = jwtGenerator(participant.rows[0].externalid__c);
        return res.json({ token });

    } catch(error) {
        console.log(error.message);
    }
});

router.post("/verify", authorization, async(req,res) => {
    try {
        console.log('verify');
        res.json(true);

    }catch(error) {
        console.log('verification' + error.message);
    }
});


module.exports = router;
