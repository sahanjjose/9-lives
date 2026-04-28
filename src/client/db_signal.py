from __future__ import annotations

import db_communicator
import exceptions as err
from api_constants import (
    NOT_FOUND,
)
from db_ping import ping_endpoint_till_connect


class VendingMachines:
    """Class exposed to inventory_manager and higher for vending machine database access.

    Methods
    -------
    vending_machine_exists(id:str)
        Checks whether vending machine exists in database
    get_vending_machine(hardware_id: str)
        Returns vending machine in json format specified by ID
    create_vending_machine(
            hardware_id: str, rowCount: int, columnCount: int, name:str = None, mode: str = "i")
        Create a new database entry for a vending machine
    set_mode(hardware_id:str, new_mode: str)
        Set the operating mode of vending machine in database
    rename(hardware_id:str, new_name: str)
        Set the name of the vending machine in database
    delete_vending_machine(hardware_id:str)
        Delete vending machine from database along with all corresponding inventory information

    """

    @staticmethod
    @ping_endpoint_till_connect()
    def vending_machine_exists(hardware_id:str) -> bool:
        try:
            VendingMachines.get_vending_machine(hardware_id)
        except err.QueryFailureError as e:
            if(e.status_code == NOT_FOUND): return False
            raise
        else: return True

    @staticmethod
    @ping_endpoint_till_connect()
    def get_vending_machine(hardware_id:str) -> (dict | None):
        return db_communicator.VMs.get_single_machine(hardware_id)

    @staticmethod
    @ping_endpoint_till_connect()
    def register_vending_machine(
        hardware_id:str, row_count:int, column_count:int) -> (dict | None):
        return db_communicator.VMs.register_machine(hardware_id, row_count, column_count)

    @staticmethod
    @ping_endpoint_till_connect()
    def set_mode(hardware_id:str, new_mode:str) -> (dict | None):
        return db_communicator.VMs.alter_mode(hardware_id, new_mode)

    @staticmethod
    @ping_endpoint_till_connect()
    def rename(hardware_id:str, new_name:str) -> (dict | None):
        return db_communicator.VMs.alter_name(hardware_id, new_name)

    @staticmethod
    @ping_endpoint_till_connect()
    def delete_vending_machine(hardware_id:str) -> (dict | None):
        res = db_communicator.VMs.delete_machine(hardware_id)

        if(VendingMachines.vending_machine_exists(hardware_id)):
            raise err.QueryFailureError("Failed to delete vending machine.")
        return res


class Items:
    """Class for retrieving all stockable items.

    Methods
    -------
    get_all_items()
        Show list of all stockable items in the database

    """

    @staticmethod
    def get_all_items() -> list[str]:
        return db_communicator.AllItems.get_items()

class Inventory:
    """Class for getting and modifying the inventories of vending machines.

    Methods
    -------
    get_inventory_of_vending_machine(hardware_id: str)
        Get all items associated with a vending machine
    update_database(hardware_id: str, inventory: list[dict[str, str]])
        Upload local changes stored in change_log to database

    """

    @staticmethod
    @ping_endpoint_till_connect()
    def get_inventory_of_vending_machine(hardware_id: str) -> (list[dict] | None):
        return db_communicator.VMItems.get_items(hardware_id)

    @staticmethod
    @ping_endpoint_till_connect()
    def update_database(hardware_id: str, inventory: list[dict[str, str]]) -> (dict | None):
        return db_communicator.VMItems.update_vm_inv(hardware_id, inventory)


class Stripe:
    """Class for processing payments.

    Methods
    -------
    get_payment_token(card_number:str, exp_month:str, exp_year:int, cvc:int)
        Get a secure payment token associated with a card for payment
    charge(token: str, amount: float)
        Use the payment token to charge an amount to a customer's payment method

    """

    @staticmethod
    @ping_endpoint_till_connect()
    def get_payment_token(card_number:str, exp_month:str, exp_year:int, cvc:int) -> str:
        return db_communicator.Stripe.create_payment_token(card_number, exp_month, exp_year, cvc)

    @staticmethod
    @ping_endpoint_till_connect()
    def charge(token: str, amount: int) -> (dict | None):
        if(amount == 0): return None
        return db_communicator.Stripe.charge_card(min(amount, 50), token)

    @staticmethod
    @ping_endpoint_till_connect()
    def make_payment(
        card_number:str, exp_month:str, exp_year:int, cvc:int, amount:float,
        ) -> (dict | None):
        return Stripe.charge(
            Stripe.get_payment_token(card_number, exp_month, exp_year, cvc), amount)
