const { verify } = require("crypto");
const db = require("./db_connection");
const users = require("../db/users");

const org_exist = async (org_id) => {   
    try {
        const [results] = await db.query("SELECT * FROM orgs WHERE org_id = ?", [org_id]);
        return results.length > 0;
    } catch (err) {
        console.error(err);
        throw new Error("Error checking organization existence");
    }
}

const org_users = async (org_id) => {   

    if(! await org_exist(org_id)){
        return false;
    }
    try {
        const [results] = await db.query("SELECT * FROM users WHERE org_id = ?", [org_id]);
        return results; 
    } catch (err) {
        throw new Error("Error checking organization users"), err;
    }
}

const org_vm = async(org_id, res) => {


    if(! await org_exist(org_id)){
        return res.status(404).json({ error: "No org found with id:", id})
    }

    try {
        const [results] = await db.query("SELECT * FROM vending_machines WHERE org_id = ?", [org_id]);
        return results; 
    } catch (err) {
        throw new Error("Error checking organization vending machines");
    }

}

const org_groups = async(org_id) => {

    if(! await org_exist(org_id)){
        return res.status(404).json({ error: "No org found with id:", id})
    }

    try {
        const [results] = await db.query("SELECT * FROM grp WHERE org_id = ?", [org_id]);
        return results; 
    } catch (err) {
        console.error(err);
        throw new Error("Error checking organization groups");
    }
}

const get_org = async(org_id, res) => {
    try{
        const [results] = await db.query("SELECT * FROM orgs WHERE org_id = ?", [org_id]);
        if (results.length <= 0){
            
            return res.status(404).json({ error: "No org found with id:", org_id})
        
        }
        else{
           res.json(results);
        }
    } catch (err) {
        return res.status(500).json({error: "Server error getting orgs."});
    }
}

const delete_org_empty = async(org_id) => {
    
    if(org_id == 1000001){
        return false;
    }

    members = await org_users(org_id);
    if (members.length > 0){
        return false;
    }

    try {
        const [results] = await db.query("DELETE FROM orgs WHERE org_id = ?", [org_id]);
        return results; 
    } catch (err) {
        console.error(err);
        throw new Error("Error deleting organization");
    }

}

const delete_grp_empty = async(grp_id) => {
    
    if(grp_id == 3000001){
        return false;
    }

    members = await users.user_groups(grp_id);
    if (members.length > 0){
        return false;
    }

    try {
        const [results] = await db.query("DELETE FROM grp WHERE grp_id = ?", [grp_id]);
        return results; 
    } catch (err) {
        console.error(err);
        throw new Error("Error deleting group");
    }

}

module.exports = {get_org, org_exist, org_users, org_vm, org_groups, delete_org_empty};


