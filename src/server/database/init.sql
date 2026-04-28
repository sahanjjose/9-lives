USE VendingMachineDB;

CREATE TABLE IF NOT EXISTS orgs (
    org_id INT AUTO_INCREMENT PRIMARY KEY, 
    org_name VARCHAR(20)
);
ALTER TABLE orgs AUTO_INCREMENT = 1000001;

CREATE TABLE IF NOT EXISTS users (
    u_id INT AUTO_INCREMENT PRIMARY KEY,
    u_name VARCHAR(20) NOT NULL, 
    email VARCHAR(255) NOT NULL UNIQUE,
    u_role VARCHAR(12) DEFAULT 'maintainer', 
    org_id INT NOT NULL DEFAULT 1000001, 
    group_id INT NOT NULL DEFAULT 3000001,
    hash_p VARCHAR(255) NOT NULL,
    FOREIGN KEY (org_id) REFERENCES orgs(org_id) ON DELETE CASCADE
);
ALTER TABLE users AUTO_INCREMENT = 2000001;

CREATE TABLE IF NOT EXISTS grp (
    group_id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(20) NOT NULL UNIQUE,
    org_id INT NOT NULL,
    FOREIGN KEY (org_id) REFERENCES orgs(org_id) ON DELETE CASCADE
);
ALTER TABLE grp AUTO_INCREMENT = 3000001;

ALTER TABLE users ADD
    FOREIGN KEY (group_id) REFERENCES grp(group_id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS vending_machines (
    vm_id VARCHAR(10) PRIMARY KEY,
    vm_name VARCHAR(100),
    vm_row_count INT UNSIGNED DEFAULT 0, -- Added default value
    vm_column_count INT UNSIGNED DEFAULT 0, -- Added default value
    vm_mode CHAR(1) NOT NULL DEFAULT 'i', -- "i" for idle, "r" for restocking, "t" for transaction
    org_id INT NOT NULL, 
    FOREIGN KEY (org_id) REFERENCES orgs(org_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS grpjoin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vm_id VARCHAR(10) NOT NULL,
    group_id INT NOT NULL,
    FOREIGN KEY (vm_id) REFERENCES vending_machines(vm_id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES grp(group_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    img_URL VARCHAR(255),
    img BLOB,
    item_name VARCHAR(255) NOT NULL UNIQUE
);
ALTER TABLE items AUTO_INCREMENT = 4000001;

CREATE TABLE IF NOT EXISTS inventory_join_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    IJT_vm_id VARCHAR(10) NOT NULL,
    IJT_slot_name VARCHAR(5) NOT NULL,
    IJT_item_id INT NOT NULL,
    IJT_price DECIMAL(10, 2) UNSIGNED NOT NULL,
    IJT_stock INT UNSIGNED NOT NULL,
    UNIQUE (IJT_vm_id, IJT_slot_name),
    FOREIGN KEY (IJT_vm_id) REFERENCES vending_machines(vm_id) ON DELETE CASCADE,
    FOREIGN KEY (IJT_item_id) REFERENCES items(item_id) ON DELETE CASCADE
);

INSERT INTO orgs (org_name) VALUES
('Org1'); 

INSERT INTO grp (group_name, org_id) VALUES
('Group1', 1000001); -- grp id 3000001
