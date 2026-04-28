const express = require("express");
const db = require("./db_connection");
const orgData = require("../db/orgs")
const router = express.Router({ mergeParams: true }); // params from parents
const login = require("../email/login");

router.get("grps/:id", async(req, res) => {

    const { id } = req.params;

  


});

router.post("/grps/:id", async (req, res) => {
   
    const { group_id } = req.params;
    const { group_name, org_id } = req.body;

    await db.query(
        'INSERT INTO grps (group_id), (group_name), (org_id) = VALUES ( ? ? ? )', 
        [group_id, group_name, org_id]
    );


});

router.get("/grps/:id/display", async (req, res) => {
   
    const { id } = req.params;
    
    const[ credentials ] = req.body;

   let jsonArray = [
    { "users": await ...},
   
    { "vms": await ...}
    ];

    res.json(jsonArray);
  
});
