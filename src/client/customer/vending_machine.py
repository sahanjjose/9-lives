from __future__ import annotations  # noqa: INP001

import exceptions as err
from api_constants import BAD_REQUEST

# from customer.cardinfo import CardInfo  # noqa: ERA001
from customer.mqtt import MQTTConnection
from db_signal import Stripe, VendingMachines
from enum_types import InventoryManagerMode
from inventory_manager import InventoryManager


class VendingMachine:
    """Item management logic for vending machine.

    Attributes
    ----------
    inv_man: InventoryManager
        Instance of InventoryManager class that manages vending machine inventory
    stripe_payment_token: str
        Token used to call Stripe API
    transaction_price: float
        The total price of the current ongoing transaction

    Methods
    -------
    def list_options(self, show_empty_slots = False) -> str
        Returns a string representation of the inventory of the vending machine
    def start_transaction(self) -> None
        Only callable if mode of inv_man is IDLE
        Sets mode of inv_man to TRANSACTION
        Calls Stripe API to get stripe_payment_token for api calls
    def buy_item(self, slot_name) -> str
        Only callable if mode of inv_man is TRANSACTION
        Dispense item selected
        Update stock information and database (might happen in inventory_manager implementation)
        Add price of item to transaction_price
    def buy_free_item(self, slot_name) -> str
        Only callable if mode of inv_man is TRANSACTION
        Make SURE that item cost is 0
        Dispense item selected
        Update stock information and database (might happen in inventory_manager implementation)
        Reset mode back to IDLE
        Returns name of item that was purchased
    def end_transaction(self) -> float
        Only callable if mode of inv_man is TRANSACTION
        Use Stripe API to charge user's payment method with transaction_price
        Clear transaction_price and stripe_payment_token
        Sets mode of inv_man to IDLE
        Returns total purchase price
    def reload_data(self) -> None
        Temporary function that loads up to date information from the database,
        will be automated with message queueing in the future.

    """

    def __init__(self, rows: int, columns: int, hardware_id: str, name: str | None = None) -> None:
        self.__hardware_id: str = hardware_id
        self.inv_man = InventoryManager(rows, columns, hardware_id)

        # Check if vending machine exists in database, if not create it
        vm_db = VendingMachines.get_vending_machine(self.__hardware_id)

        if(vm_db["vm_row_count"] == 0 or vm_db["vm_column_count"] == 0):
            try:
                VendingMachines.register_vending_machine(self.__hardware_id, rows, columns)
            except err.QueryFailureError as e:
                # If error code is 400, vending machine exists so we ignore the error.
                if e.status_code != BAD_REQUEST:
                    raise

        # Load data from database
        self.inv_man.sync_from_database()

        self.__stripe_payment_token: str = None
        self.__transaction_price: float = 0

        MQTTConnection.start_mqtt_connection(self.__hardware_id, self.inv_man)

    def list_options(self) -> str:
        return self.inv_man.get_stock_information()

    def start_transaction(self) -> None:
        # set_mode will check that mode is in correct state(IDLE), throws error otherwise
        self.inv_man.set_mode(InventoryManagerMode.TRANSACTION)

        # Temporary function to get card info
        # card_number, exp_month, exp_year, cvc = CardInfo.get_card_info()  # noqa: ERA001
        card_number, exp_month, exp_year, cvc = "","","",""

        # stripe API implementation to log user in and obtain API token
        self.__stripe_payment_token = Stripe.get_payment_token(
            card_number, exp_month, exp_year, cvc,
        )

    def buy_item(self, slot_name: str) -> str:
        if self.inv_man.get_mode() is not InventoryManagerMode.TRANSACTION:
            raise err.InvalidModeError(
                "buy_item() can only be called when transaction is "
                "in progress. Call start_transaction() first",
            )

        purchase_price = self.inv_man.change_stock(slot_name, -1)
        self.__transaction_price = round(self.__transaction_price + purchase_price, 2)
        return self.inv_man.get_item(slot_name).get_name()

    def buy_free_item(self, slot_name: str) -> str:
        # set_mode will check that mode is in correct state(IDLE), throws error otherwise
        item = self.inv_man.get_item(slot_name)

        # Ensure that the item that you're dispensing for free is ACTUALLY free.
        if item.get_cost() != 0:
            raise err.NotFreeItemError("Cost of slot must be 0 to use this function.")

        self.inv_man.set_mode(InventoryManagerMode.TRANSACTION)
        self.inv_man.change_stock(slot_name, -1)
        self.inv_man.save_inventory_to_db()
        self.inv_man.set_mode(InventoryManagerMode.IDLE)

        return item.get_name()

    def end_transaction(self) -> float:
        # This check is necessary because we want to make sure inv_man is in the correct state but
        # we want to change to IDLE only AFTER all operations (api and variables reset) are done.
        if self.inv_man.get_mode() is not InventoryManagerMode.TRANSACTION:
            raise err.InvalidModeError(
                "Transaction is not currently in progress, start a transaction first",
            )

        # Use stripe API to charge self.transaction_price with self.stripe_payment_token
        Stripe.charge(self.__stripe_payment_token, int(self.__transaction_price * 100))

        # Save changes to database
        self.inv_man.save_inventory_to_db()

        out = self.__transaction_price
        self.__transaction_price = 0
        self.__stripe_payment_token = None

        self.inv_man.set_mode(InventoryManagerMode.IDLE)
        return out

    def get_price(self, slot_name: str) -> float:
        return self.inv_man.get_item(slot_name).get_cost()

    def reload_data(self):
        self.inv_man.sync_from_database()
