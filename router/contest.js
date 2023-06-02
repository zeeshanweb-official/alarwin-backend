const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send({ response: "I am alive" }).status(200);
});
router.get("/mycontests", authorization, async (req, res) => {
    try {
        //get all participations based on external ID
        const mycontests = await pool.query("SELECT * FROM salesforce.participation__c AS participation, salesforce.contest__c AS contest WHERE participation.participant__r__externalid__c = $1 AND contest.sfid = participation.contest__c",
            [req.user.id]);
        res.json(mycontests.rows);

    } catch (err) {
        console.log('error my contests' + err.message);
    }
});

router.get("/allcontests", authorization, async (req, res) => {
    try {
        //gets all contests in the future
        const allContests = await pool.query("SELECT * FROM salesforce.contest__c WHERE status__c != 'Finished' AND start_time__c > now()");
        res.json(allContests.rows);

    } catch (err) {
        console.log('error all contests' + err.message);
    }
});

router.get("/contestdetail/:id", async (req, res) => {
    try {
        const {id} = req.params;
        const contest = await pool.query("SELECT * FROM salesforce.contest__c WHERE sfid = $1", [id]);
        res.json(contest.rows[0]);
    } catch (err) {
        console.log('error get contest: ' + req.params);
    }
});
router.get("/contestparticipations/:contest_id", authorization, async (req, res) => {
    try {
        const {contest_id} = req.params;
        const part = await pool.query("SELECT * FROM salesforce.participant__c AS participant, salesforce.participation__c AS participation WHERE participation.contest__c = $1 AND participation.participant__r__externalid__c = participant.externalid__c::text;", [contest_id]);
        res.json(part.rows);
    } catch (err) {
        console.log('err all participations by contest::' + err);
    }
});


router.get("/participationbycontest/:contest_id", authorization, async (req, res) => {
    try {
        const {contest_id} = req.params;

        const part = await pool.query("SELECT * FROM salesforce.participation__c WHERE contest__c = $1 AND participant__r__externalid__c = $2", [contest_id, req.user.id]);
        
        res.json(part.rows[0]);
    } catch (err) {
        console.log('err participation by contest' + err);
    }
});
router.post("/countsubsegment/", authorization, async (req, res) => {
    try {
        const {conid, subseg} = req.body;
        
        const subsegQuestions = await pool.query("SELECT * FROM salesforce.question__c WHERE contest__c = $1 AND published__c = true AND SubSegment__c = $2", [conid, subseg]
        );
        
        res.json(subsegQuestions.rows.length);

    } catch (error) {
        console.log('error disable questions :: ' + error.message);
    }
});
router.post("/contestwon", authorization, async (req, res) => {
    try {
        const contestwoncount = await pool.query(
            "SELECT * FROM salesforce.participant__c WHERE sfid = $1",
            [req.user.id]
        );

        var contestwonnewcount = contestwoncount.Contests_Won__c + 1;
        const wonparticipant = await pool.query(
            "UPDATE salesforce.participant__c SET Contests_Won__c = $1 WHERE sfid = $2 RETURNING *",
            [contestwonnewcount, req.user.id]
        );
        res.json(wonparticipant.rows);

    } catch (err) {
        console.log('contest won error ' + err);
    }

});

router.post("/submitpartanswers", authorization, async (req, res) => {
    try {
        const {partanswers} = req.body;
        var parts = [];
        var participationrec = partanswers[0].participation__c;
        console.log('record' + participationrec);
        
        for(var i=0; i < partanswers.length; i++){
            var answer = partanswers[i];
         
            const partans = await pool.query(
                "UPDATE salesforce.Participation_Answers__c SET selection__c = $1, selection_value__c = $2, Status__c = $3, ExternalId__c = gen_random_uuid() WHERE Participation__c = $4 AND Question__c = $5 RETURNING *", [answer.selection__c, answer.selection_value__c, 'Submitted', answer.participation__c, answer.question__c]
                );
            
            parts.push(partans.rows[0]);

            
        }

        const part = await pool.query(
            "UPDATE salesforce.Participation__c SET Questions_Submitted__c = true WHERE sfid = $1", [participationrec]
            );
        
       
        res.json(parts);
    } catch (err) {
        console.log('error on submit answer' + err);
    }

});

module.exports = router;