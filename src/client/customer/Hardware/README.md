# Hardware

## Overview

This project involves building a small vending machine controlled by a Raspberry Pi. The Raspberry Pi will act as the central hardware controller, interfacing with various sensors and motors to dispense items. The system will connect to a backend server hosted on the **CSL machines**, which will handle business logic, inventory management, and user interactions.

## Hardware Components

- **Raspberry Pi**: The main controller responsible for managing the vending machine hardware.
- **Motors**: Used to dispense items from the vending machine.
- **Sensors**: Provide data on inventory levels, user interactions, and error states.
- **Network Connectivity**: The Raspberry Pi will communicate with the backend server via the **Campus VPN**.

## Backend Server

The backend server is hosted on **CSL machines** and will be responsible for:
- Processing vending machine transactions.
- Maintaining an inventory database.
- Communicating with the Raspberry Pi for real-time control and monitoring for some aspects where some control will be local on the pi. 

## Connecting the Raspberry Pi to Campus VPN

To enable the Raspberry Pi to communicate with the backend server, it must first connect to the **Campus VPN**. 

The scripts necessary for this are located in the `Hardware/` directory. Specifically:
- **`startVPN.sh`**: This script sets up and starts the VPN connection. Run it to establish a secure connection to the campus network.

### Running the VPN Connection Script
To start the VPN connection, execute the following command on the Raspberry Pi:

```bash
cd Hardware/
./startVPN.sh
```
