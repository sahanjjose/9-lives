# Specification Document

## 9 Lives

### CI/CD Status

![pipeline status](https://git.doit.wisc.edu/cdis/cs/courses/cs506/sp2025/team/T_19/Project_19/badges/main/pipeline.svg)
![Test Coverage](https://git.doit.wisc.edu/cdis/cs/courses/cs506/sp2025/team/T_19/Project_19/badges/main/coverage.svg)

### Project Abstract

After a couple months of hard work, we have successfully reached a point where customers and vendors can fully interact with a simulated vending machine on the command line. This simulation through the command line uses Python for the frontend (aside: we had said originally that if speed became an issue, we would consider refactoring to C++; this has not become an issue). The backend server (which we make HTTP requests to) is a NodeJS server. The database being used is a MySQL database. Both command lines can be run anywhere Docker is installed. All you have to do is clone the repository, navigate to src/client, and run "./startup_docker_container.sh vendor" or "./startup_docker_container.sh vm". Please note, Docker must be running, and you must be connected to the campus VPN.

Running the script with option "vm" simulates the process of viewing the items in a vending machine. This automatically queries the database for items of the vending machine identified by the hardware ID stored in "src/client/customer/configuration.json".

Running the script with option "vendor" simulates the process of restocking a vending machine as a vendor. For example, you can add entirely new items, or you can add more of an item already in the vending machine.

Now that we have the command line interfaces fully integrated with the backend database and server, we are prepared to move forward with a hardware vending machine to be used by customers and a React Native frontend to be used by vendors.

The hardware will dispense a single type of item, like soda cans or chip bags. It will be controlled by a Raspberry Pi, which will use the Python code we've already developed (and is currently used by the vendor command line interface).

The vendor-side application will be a React Native application. This will be hosted on the team's CSL machine.

Once the hardware and vendor-side React application are both implemented, the database will be the only means of communication between the software running on the physical vending machine and vendors restocking or viewing information on the React application.

Each vendor-side user will be associated with an organization. Each organization can have many users. Users will be either an admin or a maintainer. Admins can view information about all vending machines in the organization, while maintainers can only view the information of vending machines which they are assigned to restock by an organization admin. Each organization must have at least 1 admin, but no maintainers are strictly required.

When a user creates an account, they can either create an organization or join an organization. If they create an organization, they will automatically be an admin. If they join an organization, they will automatically be a maintainer assigned to no vending machines. Admins of the organization can promote a new maintainer to be an admin if they choose. Admins also hold the privilege of assigning maintainers to vending machines.

Please see the following diagrams to better understand organization structure and the control flow of adding new users:

```mermaid
---
title: Organization structure
---
classDiagram
    class Organization {
        1 or more Admins
        0 or more Maintainers
        0 or more VendingMachines
    }

    class Admin1
    class Admin2

    class Maintainer1
    class Maintainer2
    class Maintainer3

    class VendingMachine1
    class VendingMachine2
    class VendingMachine3
    class VendingMachine4
    class VendingMachine5

    Organization --> Admin1
    Organization --> Admin2

    Organization --> Maintainer1
    Organization --> Maintainer2
    Organization --> Maintainer3

    Admin1 --> VendingMachine1
    Admin1 --> VendingMachine2
    Admin1 --> VendingMachine3
    Admin1 --> VendingMachine4
    Admin1 --> VendingMachine5

    Admin2 --> VendingMachine1
    Admin2 --> VendingMachine2
    Admin2 --> VendingMachine3
    Admin2 --> VendingMachine4
    Admin2 --> VendingMachine5

    Maintainer1 --> VendingMachine1
    Maintainer1 --> VendingMachine2
    
    Maintainer2 --> VendingMachine2
    Maintainer2 --> VendingMachine3
    Maintainer2 --> VendingMachine4

    
    Maintainer3 --> VendingMachine5
```

```mermaid
---
title: User/Organization Creation
---
graph TD;
    Start["User Creates Account"] -->|Creates Organization| NewOrg["New Organization"]
    NewOrg -->|User Becomes Admin| AdminRole["Assigned Admin Role"]

    Start -->|Joins Organization| ExistingOrg["Existing Organization"]
    ExistingOrg -->|User Becomes Maintainer| MaintainerRole["Assigned Maintainer Role (No VMs)"]

    AdminRole -->|Can Assign Maintainers| AssignMaintainers["Assign Maintain. to VMs"]
    AdminRole -->|Can Promote Maintainers| PromoteMaintainer["Promote Maintain. to Admin"]
```

### Customer

The customer for this software will be customers who would like to purchase an item from the vending machine as well as the vendors who'd like to sell their products in the vending machine. We have two interaces: one for customers to purchase items, and one for vendors to view sales information and restock.

### Specification

#### Technology Stack

```mermaid
flowchart RL
subgraph Vending Machine Hardware
    A(Raspberry Pi)
end

subgraph Hardware \"Backend\"
    B(Python)
end
	
subgraph Backend
    C(JS Server)
end
	
subgraph Database
    D(MySQL)
end

subgraph Vendor Frontend
    E(React Native)
end

A <-->|Physical Parts| B
B <-->|HTTP Requests| C
C <-->|Directly with database| D
E <-->|HTTP Requests| C
```

#### Database

```mermaid
---
title: Vending Machine Database ERD
---
erDiagram
    ORGANIZATION {
        INT organization_id PK "Auto-increment"
        VARCHAR(255) organization_name "Not NULL, Unique"
    }

    USER {
        INT user_id PK "Auto-increment"
        VARCHAR(255) user_email "Not NULL, Unique"
        VARCHAR(255) user_username "Not NULL, Unique"
        INT user_organization_id FK "References ORGANIZATION(organization_id), Not NULL"
        VARCHAR user_position "Not NULL"
    }

    VENDING_MACHINE {
        INT vm_id PK "Auto-increment (1000001+)"
        VARCHAR(100) vm_name
        INT vm_row_count "Unsigned, Not NULL"
        INT vm_column_count "Unsigned, Not NULL"
        INT vm_organization_id FK "References ORGANIZATION(organization_id), Not NULL"
        INT vm_vendor_id "Future Implementation"
    }

    ITEMS {
        INT item_id PK "Auto-increment (2000001+)"
        VARCHAR(255) item_name "Not NULL, Unique"
    }

    INVENTORY_JOIN_TABLE {
        INT IJT_vm_id PK, FK "References VENDING_MACHINE(vm_id) Not NULL"
        VARCHAR(5) IJT_slot_name PK "Not NULL"
        INT IJT_item_id FK "References ITEMS(item_id), Not NULL"
        DECIMAL(10) IJT_price "Unsigned, Not NULL"
        INT IJT_stock "Unsigned, Not NULL"
    }

    USER_VM_JOIN_TABLE {
        INT UVJT_user_id PK, FK "References USER(user_id) Not NULL"
        INT UVJT_vm_id PK, FK "References VENDING_MACHINE(vm_id) Not NULL"
    }

    %% Relationships
    ORGANIZATION ||--o{ USER : employs
    ORGANIZATION ||--o{ VENDING_MACHINE : owns
    USER ||--o{ USER_VM_JOIN_TABLE : assigned_to
    VENDING_MACHINE ||--o{ USER_VM_JOIN_TABLE : viewed_by
    VENDING_MACHINE ||--o{ INVENTORY_JOIN_TABLE : contains
    ITEMS ||--o{ INVENTORY_JOIN_TABLE : stocked_in

```

#### [Class Diagram](docs/architecture.md)

Please follow the link above.

#### CLI Flowchart

```mermaid
---
title: Vending Machine Program Flowchart
---
graph TD;
    Start([Start]) --> Select_Mode{Select Mode};
    
    Select_Mode -->|Vendor| Vendor_Mode;
    Vendor_Mode --> Display_All[/Display All Slots/];
    Display_All --> Vendor_Choice{Select Option};

    Vendor_Choice --> |Adjust Stock|adjust_stock[/Enter "slot quantity"/];
    adjust_stock --> Display_All;

    Vendor_Choice --> |Add Item|add_item[/Enter "slot item price quantity"/];
    add_item --> Display_All;

    Vendor_Choice --> |Clear Slot|clear_slot[/Enter "slot"/];
    clear_slot --> Display_All;

    Vendor_Choice --> |Set Cost|set_cost[/Enter "slot new_price"/];
    set_cost --> Display_All;

    Vendor_Choice --> |Exit Vendor|Select_Mode;

    
    Select_Mode -->|Customer| Customer_Mode;
    Customer_Mode --> Display_Available[/Display Available Products/];
    Display_Available --> Customer_Choice{Select Option};

    Customer_Choice --> Process_Payment[/Process Payment/];
    Process_Payment --> |Success|Dispense_Item[/Dispense Item/];
    Dispense_Item --> Dispense_Item;
    Dispense_Item --> |Finish Transaction|Display_Available
    Process_Payment --> |Failed| Payment_Failed[/Payment Failed, Try Again/];
    Payment_Failed --> Display_Available
    
    Customer_Choice --> |Exit Customer|Select_Mode;

    Select_Mode --> |Exit| End([End]);
```

#### Vending Machine FLowchart

TODO: Fill this out once we know a bit more about how the physical vending machine will be interacted with. This should be very similar to the customer half of the flowchart above.

#### Vendor Application Flowchart

TODO: Once more details of the vendor application have been decided upon, this will need to be filled in and a diagram should be created...

for now, here's what we know:
- the user first logs in
- a new user account can be created if the user doesn't yet have a login
- when creating a new user account, the user can either create an organization (and by the admin by default), or they can join an existing organization (and be a maintainer by default -- in this scenario, the admin of the organization can promote them to an admin)
- then the user has a few options...
- If they are an admin, they can view information about all of the organization's vending machines
- If they are a maintainer, they can only view information about the organization's vending machines that they have been assigned to (ones they restock) by an admin


### Standards & Conventions

<!--This is a link to a seperate coding conventions document / style guide-->
[Style Guide & Conventions](STYLE.md)
