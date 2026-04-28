import json
import sys
import textwrap

import exceptions as err
from api_constants import NOT_FOUND
from customer.vending_machine import VendingMachine

vending_machine: VendingMachine = None

def main():
    global vending_machine

    with open("customer/configuration.json") as file:  # noqa: PTH123
        data = json.load(file)
        row = data["rows"]
        col = data["columns"]
        hardware_id = data["hardware_id"]

        try:
            vending_machine = VendingMachine(row, col, hardware_id)
        except err.InvalidDimensionsError as e:
            print("Error: ", e)
            sys.exit(1)
        except err.QueryFailureError as e:
            print("Error: ", e)
            if(e.status_code == NOT_FOUND):
                print("Vending Machine not Registered on Vendor Side.")
            sys.exit(1)

    customer_mode()


def customer_mode():
    global vending_machine

    while(True):
        print("Vending Machine Inventory: ")
        print()
        print(vending_machine.list_options())
        user_input = input(textwrap.dedent("""
                    Please select one of the following options
                    1. List Options
                    2. Dispense Free Item
                    3. Enter Payment Information
                    4. Reload Inventory from Database
                    5. Exit Customer CLI
                """))

        if(user_input == "1"):
            vending_machine.list_options()
        elif(user_input == "2"):
            dispense_free()
        elif(user_input == "3"):
            perform_transaction()
        elif(user_input == "4"):
            vending_machine.reload_data()
        elif(user_input == "5"):
            return
        else:
            print("Invalid input, please type an option 1 - 4")


def dispense_free():
    selection = input("Please type the slot name of the item you would like to purchase: ")

    try:
        dispensed_item = vending_machine.buy_free_item(selection)
        print("Dispensing Item: " + dispensed_item)
        print("Vending Machine Inventory: ")
    except err.NegativeStockError:
        print("Item at this slot is out of stock, please try another.")
    except err.EmptySlotError as e:
        print("Error: ", e)
    except err.InvalidSlotNameError as e:
        print("Error: ", e)
    except err.NotFreeItemError as e:
        print("Error: ", e)


def perform_transaction():
    global vending_machine
    try:
        vending_machine.start_transaction()
        # All the stripe API payment stuff should happen inside here ^^
    except err.InvalidModeError as e:
        print("Error: " + str(e))
        return

    print("Payment Information Entered...")

    while(True):
        selection = input("Please type the slot name of the item you would like to purchase, " \
                          "or Q to finish transaction: ")
        if(selection == "Q"):
            try:
                print(f"Payment method was charged {vending_machine.end_transaction()!s}")
                print()
            except err.QueryFailureError as e:
                print("Error: ", e)
            return

        try:
            dispensed_item = vending_machine.buy_item(selection)
            print("Dispensing Item: " + dispensed_item)
            print("Vending Machine Inventory: ")
            print(vending_machine.list_options())
        except err.NegativeStockError:
            print("Item at this slot is out of stock, please try another.")
        except err.EmptySlotError as e:
            print("Error: ", e)
        except err.InvalidSlotNameError as e:
            print("Error: ", e)


if __name__ == "__main__":
    main()
