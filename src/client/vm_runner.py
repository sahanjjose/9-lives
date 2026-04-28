import asyncio
import json
import sys

import exceptions as err
from api_constants import NOT_FOUND
from customer.Hardware.hardware_constants import (
    CARD_INFO_KEY,
    DELETE_KEY,
    DISPENSE_KEY,
    END_TRANSACTION_KEY,
    LCD_LINE_1,
    LCD_LINE_2,
)
from customer.hardware_manager import DispenserManager, DisplayManager, InputManager
from customer.vending_machine import VendingMachine


class VendingMachineRunner:
    """Class runs on the pi and integrates database inventory functionality and hardware."""

    def __init__(
        self,
        input_mgr: InputManager,
        display_mgr: DisplayManager,
        dispenser_mgr: DispenserManager,
        config_file: str,
    ) -> None:
        self.input = input_mgr
        self.display = display_mgr
        self.dispenser = dispenser_mgr
        self.vending_machine: VendingMachine = None

        with open(config_file) as file:  # noqa: PTH123
            data = json.load(file)
            row = data["rows"]
            col = data["columns"]
            hardware_id = data["hardware_id"]

            try:
                self.vending_machine = VendingMachine(row, col, hardware_id)
            except err.InvalidDimensionsError as e:
                print("Error: ", e)
                sys.exit(1)
            except err.QueryFailureError as e:
                print("Error: ", e)
                if(e.status_code == NOT_FOUND):
                    print("Vending Machine not Registered on Vendor Side.")
                sys.exit(1)

    async def run(self):
        await self.input.start()
        await self.display.start()
        try:
            await self.run_default_state()
        finally:
            await self.input.close()

    async def run_default_state(self):
        # Endlessly run default state and execute based on inputs accordingly
        while True:
            input_string = await self.get_and_display_input(
                f"CHOOSE SLOT OR {CARD_INFO_KEY}",
                "",
                {CARD_INFO_KEY},
            )
            if input_string is CARD_INFO_KEY:
                # Card info key is pressed, transaction start
                try:
                    await self.perform_transaction()
                except err.InvalidModeError as e:
                    print("Error: " + str(e))
                    await self.display.show_text("INVALID MODE", LCD_LINE_1)
                    await asyncio.sleep(1)
            else:
                try:
                    # Free item is chosen, dispense
                    await self.dispense_free_item(input_string)
                except err.NotFreeItemError:
                    # Normal item is chosen, show price (can't dispense unless transaction start)
                    price = self.vending_machine.get_price(input_string)
                    await self.display.show_text(
                        f"${price:.2f}",
                        LCD_LINE_1,
                    )
                    await asyncio.sleep(2)

    async def dispense_free_item(self, selection: str):
        try:
            # Dispense item in software
            dispensed_item = self.vending_machine.buy_free_item(selection)

            # If successfully dispensed in software, dispense in hardware
            await self.display.show_text("Dispensing " + selection, LCD_LINE_1)
            row, col = self.vending_machine.inv_man.get_coordinates_from_slotname(selection)
            await self.dispenser.dispense(row, col)
            print("Dispensing Item: " + dispensed_item)
        except err.NegativeStockError:
            print("Item at this slot is out of stock, please try another.")
            await self.display.show_text("OUT OF STOCK", LCD_LINE_1)
            await asyncio.sleep(1)
        except err.EmptySlotError as e:
            await self.display.show_text("OUT OF STOCK", LCD_LINE_1)
            print("Error: ", e)
            await asyncio.sleep(1)
        except err.InvalidSlotNameError as e:
            await self.display.show_text("INVALID SLOT", LCD_LINE_1)
            print("Error: ", e)
            await asyncio.sleep(1)

    async def perform_transaction(self):
        await self.display.show_text("ENTERING PAYMENT", LCD_LINE_1)
        await asyncio.sleep(1)

        try:
            self.vending_machine.start_transaction()
            # All the stripe API payment stuff should happen inside here ^^
        except err.InvalidModeError as e:
            print("Error: " + str(e))
            return

        print("Payment Information Entered...")

        # Endlessly ask user to input slot to dispense, or end transaction
        while True:
            selection = await self.get_and_display_input(
                "ENTER SLOT OR " + END_TRANSACTION_KEY,
                "",
                {END_TRANSACTION_KEY},
            )

            # End transaction
            if selection is END_TRANSACTION_KEY:
                try:
                    charged_value = self.vending_machine.end_transaction()
                    await self.display.show_text(f"CHARGED ${charged_value:.2f}", LCD_LINE_1)
                    await asyncio.sleep(2)
                    print(f"Payment method was charged {charged_value}")
                except err.QueryFailureError as e:
                    print("Error: ", e)
                return

            try:
                # Dispense item in software
                dispensed_item = self.vending_machine.buy_item(selection)

                # Dispense item in hardware
                await self.display.show_text("Dispensing " + selection, LCD_LINE_1)
                row, col = self.vending_machine.inv_man.get_coordinates_from_slotname(selection)
                await self.dispenser.dispense(row, col)
                print("Dispensing Item: " + dispensed_item)
            except err.NegativeStockError:
                print("Item at this slot is out of stock, please try another.")
                await self.display.show_text("OUT OF STOCK", LCD_LINE_1)
                await asyncio.sleep(1)
            except err.EmptySlotError as e:
                print("Error: ", e)
                await self.display.show_text("OUT OF STOCK", LCD_LINE_1)
                await asyncio.sleep(1)
            except err.InvalidSlotNameError as e:
                print("Error: ", e)
                await self.display.show_text("INVALID SLOT", LCD_LINE_1)
                await asyncio.sleep(1)

    async def get_and_display_input(self, line1: str, line2: str, return_keys: list[str]) -> str:
        await self.display.show_text(line1, LCD_LINE_1)
        await self.display.show_text(line2, LCD_LINE_2)
        input_string = ""

        while True:
            key = await self.input.get_key()
            print(f"Key: {key}")
            if key == DISPENSE_KEY:
                return input_string

            if key in return_keys:
                return key

            if key == DELETE_KEY:
                input_string = input_string[:-1]

            else:
                input_string += key

            await self.display.show_text(input_string, LCD_LINE_2)
