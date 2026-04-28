#TODO: put into env file
from __future__ import annotations  # noqa: F404

import exceptions as err
import requests
import stripe
from api_constants import (
    BACKEND_HOST,
    INVENTORY_ROUTE,
    ITEMS_ROUTE,
    MACHINES_ROUTE,
    REQUEST_HEADERS,
    TIMEOUT,
)


def string_builder(*args):
    return '/'.join(args)

#This class should only be used in the inventory manager file allowing complete filtered request
#to be made to the server side mySQL on the docker.

class VMs:
    """Class for all api calls pertaining to vending machine IDs and set up.

    Methods
    -------
    get_machines()
        Pull all VMs
    get_single_machine(self, hardware_id:str)
        Pull specific VM based on the UNIQUEID on the Vending_machines table
    post_machine(self, id:str, name:str, row:int, column:int, vm_mode:str)
        Insert new machine into the Vending_machines table
    delete_machine(self, id:str)
        Remove a specific machine based on it's UNIQUEID on the VM table
    alter_mode(self, id:str,mode:str)
        Change the mode of a specific machine
    alter_name(self, id:str, name:str)
        Update name of a machine by ID

    """

    #Pull all VMs
    @staticmethod
    def get_machines() -> (dict | None):
        api_route = string_builder(BACKEND_HOST,MACHINES_ROUTE)
        try:
            response = requests.get(api_route, timeout=TIMEOUT)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.ConnectionError as e:
            raise ConnectionError(f"Failed to connect to API: {e}") from e
        except requests.exceptions.RequestException as e:
            raise err.QueryFailureError("Error: " + str(e), status_code=response.status_code) from e

    #Pull specific VM based on the UNIQUEID on the Vending_machines table
    @staticmethod
    def get_single_machine(hardware_id:str) -> dict:
        api_route = string_builder(BACKEND_HOST,MACHINES_ROUTE,hardware_id)
        try:
            response = requests.get(api_route, timeout=TIMEOUT)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.ConnectionError as e:
            raise ConnectionError(f"Failed to connect to API: {e}") from e
        except requests.exceptions.RequestException as e:
            raise err.QueryFailureError("Error: " + str(e), status_code=response.status_code) from e

    #Insert new machine into the Vending_machines table
    #example machine json format:
    # [vm_id:id, vm_name"name, vm_row_count:cnt, vm_column_count:cnt, vm_mode:mode]
    #Directly relates to columns in mySQL server
    @staticmethod
    def post_machine(hardware_id:str, name:str, row:int, column:int, vm_mode:str) -> dict:
        new_info = {
            'vm_id':hardware_id,
            'vm_name':name,
            'vm_row_count':row,
            'vm_column_count': column,
            'vm_mode':vm_mode,
        }
        api_route = string_builder(BACKEND_HOST,MACHINES_ROUTE)
        try:
            response = requests.post(api_route, json=new_info, headers=REQUEST_HEADERS, timeout=TIMEOUT)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.ConnectionError as e:
            raise ConnectionError(f"Failed to connect to API: {e}") from e
        except requests.exceptions.RequestException as e:
            raise err.QueryFailureError("Error: " + str(e), status_code=response.status_code) from e


    # Register hardware side vending machine
    @staticmethod
    def register_machine(hardware_id:str, row:int, column: int) -> dict:
        new_info = {
            'vm_row_count':row,
            'vm_column_count': column,
        }

        api_route = string_builder(BACKEND_HOST, MACHINES_ROUTE, hardware_id, "register")
        try:
            response = requests.patch(api_route, json=new_info, headers=REQUEST_HEADERS, timeout=TIMEOUT)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.ConnectionError as e:
            raise ConnectionError(f"Failed to connect to API: {e}") from e
        except requests.exceptions.RequestException as e:
            raise err.QueryFailureError("Error: " + str(e), status_code=response.status_code) from e


    #Remove a specific machine based on it's UNIQUEID on the VM table
    @staticmethod
    def delete_machine(hardware_id:str) -> dict:
        api_route = string_builder(BACKEND_HOST,MACHINES_ROUTE,hardware_id)

        try:
            response = requests.delete(api_route, timeout=TIMEOUT)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.ConnectionError as e:
            raise ConnectionError(f"Failed to connect to API: {e}") from e
        except requests.exceptions.RequestException as e:
            raise err.QueryFailureError("Error: " + str(e), status_code=response.status_code) from e

    #enum_types of MODE: i, r, t
    @staticmethod
    def alter_mode(hardware_id:str, mode:str) -> dict:
        api_route = string_builder(BACKEND_HOST,MACHINES_ROUTE,hardware_id,'mode')
        payload = {"vm_mode": mode}

        try:
            response = requests.patch(api_route, json=payload, headers=REQUEST_HEADERS, timeout=TIMEOUT)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.ConnectionError as e:
            raise ConnectionError(f"Failed to connect to API: {e}") from e
        except requests.exceptions.RequestException as e:
            raise err.QueryFailureError("Error: " + str(e), status_code=response.status_code) from e

    #Update name of a machine by ID
    @staticmethod
    def alter_name(hardware_id:str, name:str) -> dict:
        api_route = string_builder(BACKEND_HOST,MACHINES_ROUTE,hardware_id,'name')
        payload = {"vm_name": name}

        try:
            response = requests.patch(api_route, json=payload, headers=REQUEST_HEADERS, timeout=TIMEOUT)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.ConnectionError as e:
            raise ConnectionError(f"Failed to connect to API: {e}") from e
        except requests.exceptions.RequestException as e:
            raise err.QueryFailureError("Error: " + str(e), status_code=response.status_code) from e

class AllItems:
    """Class for all items available for stocking.

    Methods
    -------
    get_items()
        Gets all available items inside database

    """

    #Query all available items for stocking
    @staticmethod
    def get_items() -> dict:
        api_route = string_builder(BACKEND_HOST,ITEMS_ROUTE)

        try:
            response = requests.get(api_route, timeout=TIMEOUT)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.ConnectionError as e:
            raise ConnectionError(f"Failed to connect to API: {e}") from e
        except requests.exceptions.RequestException as e:
            raise err.QueryFailureError("Error: " + str(e), status_code=response.status_code) from e

class VMItems:
    """Class for items within specific machines.

    Methods
    -------
    get_items(self, id:str)
        Gets all items within a specific machine
    add_to_slot(self, id:str, slot_name:str)
        Add an item to a specific slot
    update_item_in_slot(self, id:str, slot_name:str, item:str)
        Update an item in a specific slot
    delete_item_in_slot(self, id:str, slot_name:str, item:str)
        Delete an item in a specific slot
    update_vm_inv(self, id:str,inventory:list[dict])
        Update the inventory of a specific machine with changelog

    """

    @staticmethod
    def get_items(hardware_id:str) -> (dict | None):
        api_route = string_builder(BACKEND_HOST,MACHINES_ROUTE,hardware_id,INVENTORY_ROUTE)

        try:
            response = requests.get(api_route, timeout=TIMEOUT)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.ConnectionError as e:
            raise ConnectionError(f"Failed to connect to API: {e}") from e
        except requests.exceptions.RequestException as e:
            raise err.QueryFailureError("Error: " + str(e), status_code=response.status_code) from e

    @staticmethod
    def update_vm_inv(hardware_id:str,updated_inventory:list[dict]) -> (dict | None):
        api_route = string_builder(BACKEND_HOST,MACHINES_ROUTE,hardware_id,INVENTORY_ROUTE)

        try:
            response = requests.post(
                api_route, json=updated_inventory, headers=REQUEST_HEADERS, timeout=TIMEOUT)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.ConnectionError as e:
            raise ConnectionError(f"Failed to connect to API: {e}") from e
        except requests.exceptions.RequestException as e:
            raise err.QueryFailureError("Error: " + str(e), status_code=response.status_code) from e


class Stripe:
    """Class for handling stripe payment tokens.

    Methods
    -------
    create_payment_token(card_number:str, exp_month:str, exp_year:int, cvc:int)
        Creates a payment token for a card
    charge_card(amount: int, payment_token: str = "")
        Charges a payment method for a certain amount

    """

    @staticmethod
    def create_payment_token(card_number: str, exp_month: int, exp_year: int, cvc: str) -> (str | None):
        # try:
        #     token = stripe.Token.create(
        #     card={
        #         'number': card_number,
        #         'exp_month': exp_month,
        #         'exp_year': exp_year,
        #         'cvc': cvc,
        #     },
        #     )
        # except stripe.error.StripeError as e:
        #     return None
        # else:
        #     return token.id # Send this to the backend

        return "placeholdertoken"

    @staticmethod
    def charge_card(amount: int, payment_token: str = "") -> (dict | None):
        api_route = string_builder(BACKEND_HOST, "stripes", "pay")
        payload = {"amount": amount, "token": payment_token}

        try:
            response = requests.post(api_route, json=payload, headers=REQUEST_HEADERS, timeout=TIMEOUT)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.ConnectionError as e:
            raise ConnectionError(f"Failed to connect to API: {e}") from e
        except requests.exceptions.RequestException as e:
            raise err.QueryFailureError("Error: " + str(e), status_code=response.status_code) from e

func_dict = {
        'get_machines': VMs.get_machines,
        'get_single_machine': VMs.get_single_machine,
        'post_machine': VMs.post_machine,
        'delete_machine': VMs.delete_machine,
        'alter_mode': VMs.alter_mode,
        'alter_name': VMs.alter_name,
        'get_items': AllItems.get_items,
        'get_vm_items': VMItems.get_items,
        'update_vm_inv': VMItems.update_vm_inv,
        'create_payment_token': Stripe.create_payment_token,
        'charge_card': Stripe.charge_card,
}

param_dict = {
    'get_machines': "none",
    'get_single_machine': "id",
    'post_machine': "id:str, name:str, row:int, column:int, vm_mode:str",
    'delete_machine': "id",
    'alter_mode': "id, mode(i, j, t)",
    'alter_name': "id, name",
    'get_items': "none",
    'get_vm_items': "id",
    'update_vm_inv': "id:str,update:str",
    'create_payment_token': "card_number, exp_month, exp_year, cvc",
    'charge_card': "amount, payment_token",
}

def switch_case(case: str, args: str):

    # Get the function from the dictionary
    func = func_dict.get(case)
    if func:
        args_list = [arg.strip() for arg in args.split(",") if arg.strip()]
        return func(*args_list)

    msg = f"Invalid case: {case}"
    raise ValueError(msg)


#Main provides example calls and output for each function. Providing the current
#machines on the DB to inform the user.
#If you are having issues understanding the response utilize this.
def main():
    cont = 1
    while(cont):

        print("This file contains three classes for DB comunication.")
        for i in func_dict:
            print("Function: ", i)

        func = input("What function and args would you like to test:")
        print(param_dict.get(func))

        args = input("What args would you like to use:")

        print(switch_case(func, args))

        cont = int(input("Would you like to continue testing?(enter 1)"))


# main()
