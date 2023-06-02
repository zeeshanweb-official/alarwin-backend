const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).send({ response: "I am alive" });
});
router.get("/", async (req, res) => {
    try {
        const allParticipants = await pool.query("SELECT * FROM salesforce.participant__c");
        res.json(allParticipants.rows)
    } catch (err) {
        console.log('eerrr' + err.message);
    }
});

router.put("/participant/:id", async (req, res) => {
    try {

        const {id} = req.params;
        const {favorite_team, favorite_sport, favorite_player} = req.body;
        const updatePart = await pool.query(
            "UPDATE salesforce.participant__c SET favorite_team__c = $1, favorite_sport__c = $2, favorite_player__c = $3 WHERE ExternalId__c = $4",
            [favorite_team, favorite_sport, favorite_player, id]
        );
    } catch (err) {
        console.log('err part id' + err.message);
    }
});

router.post("/participations", async (req, res) => {
    try {
        //request user expires, find another way
        const {contest_id} = req.body;
        const part = await pool.query("SELECT * FROM salesforce.participation__c WHERE contest__c = $1 AND participant__r__externalid__c = $2", [contest_id, req.user.id]);
        if (part.rows.length != 0) {
            res.json(part.rows[0]);
            return res.status(401).send("Already Exists");
        }

        const newParticipation = await pool.query(
            "INSERT INTO salesforce.participation__c (Contest__c, Participant__r__ExternalId__c,Status__c, externalid__c) VALUES($1,$2,$3, gen_random_uuid()) RETURNING *",
            [contest_id, req.user.id, 'Active']
        );
       
        res.json(newParticipation.rows[0]);
    } catch (err) {
        console.log('error participations' + err.message);
    }
});

router.post("/participationswronganswer", async (req, res) => {
    try {
        const {partid} = req.body;
        console.log('partid::' + partid);
        const participationWrongAnswer = await pool.query("SELECT * FROM salesforce.participation__c WHERE externalid__c = $1", [partid]);
        
        console.log('row' + participationWrongAnswer.rows[0]);
        res.json(participationWrongAnswer.rows[0]);
    } catch (err) {
        console.log('participations wrong answer error ' + err);
    }
});
module.exports = router;