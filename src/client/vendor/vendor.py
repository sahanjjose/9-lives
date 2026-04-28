import exceptions as err  # noqa: INP001
from db_signal import VendingMachines
from enum_types import InventoryManagerMode
from inventory_manager import InventoryManager


class VendorInterface:
    """Item management logic for vending machine.

    Attributes
    ----------
    inv_man: InventoryManager
        Instance of InventoryManager class that manages vending machine inventory
    vm_db: dict
        A dict of attributes of the vending machine, including ID, row and column count, and name

    Methods
    -------
    def list_options(self) -> str
        Returns a string representation of the inventory of vending machine including empty slots
    def start_restocking(self) -> None
        Only callable if mode of inv_man is IDLE
        Sets mode of inv_man to RESTOCKING
    def ensure_restocking(self) -> None
        Raises an error if current mode of the inventory manager is NOT RESTOCKING
    def change_stock_of_slot(self, slot_name, amount) -> str
        Only callable if mode of inv_man is RESTOCKING
        Change the stock of an existing item in a slot by amount
    def add_item_to_slot(self, slot_name, item_name, cost, stock) -> None
        Only callable if mode of inv_man is RESTOCKING
        Add item to empty slot or override existing item
    def set_cost_of_slot(self, slot_name, new_cost) -> None
        Only callable if mode of inv_man is RESTOCKING
        Set the cost of an item in a slot to a new cost
    def clear_slot(self, slot_name) -> None
        Only callable if mode of inv_man is RESTOCKING
        Remove item (if exists) from slot
    def end_restocking(self) -> float
        Only callable if mode of inv_man is RESTOCKING
        Use Stripe API to charge user's payment method with transaction_price
        Clear transaction_price and stripe_payment_token
        Sets mode of inv_man to IDLE
        Returns total purchase price
    def reload_data(self) -> None
        Temporary function that loads up to date information from the database,
        will be automated with message queueing in the future.

    """

    def __init__(self, hardware_id: str):
        self.vm_db = VendingMachines.get_vending_machine(hardware_id)
        if(self.vm_db is None):
            raise err.QueryFailureError("Cannot init vendor, vending machine ID DNE in DB")

        self.__inv_man = InventoryManager(
            self.vm_db["vm_row_count"], self.vm_db["vm_column_count"], hardware_id)
        self.__inv_man.sync_from_database()


    def __str__(self):
        """Return a string representation of the vending machine."""
        out = ""
        if(self.vm_db["vm_name"] is not None):
            out += f"Name: {self.vm_db["vm_name"]}; "
        return (
            out + f"ID: {self.vm_db["vm_id"]}; "
            f"Dimensions: {self.vm_db["vm_row_count"]}x{self.vm_db["vm_column_count"]} slots\n"
        )


    def rename(self, new_name: str) -> None:
        VendingMachines.rename(self.vm_db["vm_id"], new_name)
        self.vm_db["vm_name"] = new_name


    def list_options(self) -> str:
        return self.__inv_man.get_stock_information(show_empty_slots=True)


    def start_restocking(self) -> None:
        # set_mode will check that mode is in correct state(IDLE), throws error otherwise
        self.__inv_man.set_mode(InventoryManagerMode.RESTOCKING)
        self.__inv_man.load_inventory_from_db()


    def ensure_restocking(self) -> bool:
        if(self.__inv_man.get_mode() is not InventoryManagerMode.RESTOCKING):
            raise err.InvalidModeError("Restocking operations can only be called when restocking"\
                             " is in progress. Call start_restocking() first")


    def change_stock_of_slot(self, slot_name: str, amount: int) -> None:
        self.ensure_restocking()
        self.__inv_man.change_stock(slot_name, amount)


    def add_item_to_slot(self, slot_name: str, item_name: str, cost: float, stock: int) -> None:
        self.ensure_restocking()
        self.__inv_man.add_item(slot_name, item_name, stock, cost)


    def set_cost_of_slot(self, slot_name: str, new_cost: float) -> None:
        self.ensure_restocking()
        self.__inv_man.set_cost(slot_name, new_cost)


    def clear_slot(self, slot_name: str) -> None:
        self.ensure_restocking()
        self.__inv_man.clear_slot(slot_name)


    def end_restocking(self) -> None:
        if(self.__inv_man.get_mode() is not InventoryManagerMode.RESTOCKING):
            raise err.InvalidModeError("Restocking is not currently in progress, "\
                                       "start a restocking operation first")

        self.__inv_man.save_inventory_to_db()
        self.__inv_man.set_mode(InventoryManagerMode.IDLE)


    def reload_data(self):
        # TODO: Automate this with message queueing
        self.__inv_man.sync_from_database()
