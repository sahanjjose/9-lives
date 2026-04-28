import sys  # noqa: INP001
import textwrap

import exceptions as err
from vendor.vendor import VendorInterface

vendor_interface: VendorInterface = None

def main():
    global vendor_interface

    hardware_id = input("Please enter a hardware_id for your vending machine: ")
    try:
        vendor_interface = VendorInterface(hardware_id)
    except err.InvalidDimensionsError as e:
        print("Error: ", e)
        sys.exit(1)
    except err.QueryFailureError as e:
        print("Error: ", e)
        sys.exit(1)

    while(True):
        print(str(vendor_interface).strip())
        user_input = input(textwrap.dedent("""
                    Please select one of the following options
                    1. View inventory
                    2. Reload inventory
                    3. Start Restocking
                    4. Rename Vending Machine
                    5. Exit Vendor CLI
                """))

        if(user_input == "1"):
            print(vendor_interface.list_options())
            print()
        elif(user_input == "2"):
            vendor_interface.reload_data()
            print("Data Reloaded")
            print()
        elif(user_input == "3"):
            vendor_mode()
        elif(user_input == "4"):
            rename()
        elif(user_input == "5"):
            return
        else:
            print("Invalid input, please neter an option 1 - 5: ")

def vendor_mode():
    global vendor_interface
    try:
        vendor_interface.start_restocking()
    except err.InvalidModeError as e:
        print("Error: ", e)
        return

    while(True):
        print(str(vendor_interface))
        print(vendor_interface.list_options())
        user_input = input(textwrap.dedent("""
                    Please select one of the following options
                    1. Update stock of a slot
                    2. Add or override an item
                    3. Set the cost of an item in a slot
                    4. Clear a slot
                    5. End Restocking
                """))

        if(user_input == "1"):
            update_stock()
            print()
        elif(user_input == "2"):
            add_item()
            print()
        elif(user_input == "3"):
            set_cost()
            print()
        elif(user_input == "4"):
            clear_slot()
            print()
        elif(user_input == "5"):
            print()
            try:
                vendor_interface.end_restocking()
            except err.QueryFailureError as e:
                print("Error: ", e)
            return
        else:
            print("Invalid input, please enter an option 1 - 5: ")


def update_stock():
    global vendor_interface

    try:
        slot = input("Please enter the slot you'd like to update: ")
        amount = int(input("Please enter the amount you'd like to change the stock by: "))
        vendor_interface.change_stock_of_slot(slot, amount)
        print("Updated slot " + slot + " by " + str(amount))
    except err.EmptySlotError as e:
        print("Error: ", e)
        return
    except err.InvalidSlotNameError as e:
        print("Error: ", e)
        return
    except err.NegativeStockError as e:
        print("Error: ", e)
        return

def add_item():
    global vendor_interface

    try:
        slot = input("Please enter the slot you'd like to update: ")
        name = input("Please enter the name of the item you'd like to add: ")
        cost = float(input("Please enter the price of the item you'd like to add (dollars): "))
        amount = int(input("Please enter the amount you'd like to change the stock by: "))
        vendor_interface.add_item_to_slot(slot, name, cost, amount)
        print(f"Added {amount!s} of {name} of price {cost!s} to slot {slot}")
    except err.EmptySlotError as e:
        print("Error: ", e)
        return
    except err.InvalidSlotNameError as e:
        print("Error: ", e)
        return
    except err.NegativeStockError as e:
        print("Error: ", e)
        return
    except err.NegativeCostError as e:
        print("Error: ", e)
        return


def set_cost():
    global vendor_interface

    try:
        slot = input("Please enter the slot you'd like to update: ")
        cost = float(input("Please enter the new price of this slot: "))
        vendor_interface.set_cost_of_slot(slot, cost)
        print(f"Set the cost of slot {slot} to {cost!s}")
    except err.InvalidSlotNameError as e:
        print("Error: ", e)
        return
    except err.NegativeCostError as e:
        print("Error: ", e)
        return


def clear_slot():
    global vendor_interface

    try:
        slot = input("Please enter the slot you'd like to clear: ")
        vendor_interface.clear_slot(slot)
        print(f"Cleared slot {slot}")
    except err.InvalidSlotNameError as e:
        print("Error: ", e)
        return


def rename():
    global vendor_interface
    try:
        new_name = input("Please enter a new name for the vending machine: ")
        vendor_interface.rename(new_name)
    except err.QueryFailureError as e:
        print("Error: ", e)
        return


if __name__ == "__main__":
    main()
