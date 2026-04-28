import asyncio
from typing import NoReturn

from hardware_constants import KEYPAD_COL_PINS, KEYPAD_LAYOUT, KEYPAD_ROW_PINS
from keypad import AsyncKeypad


async def main() -> NoReturn:
    keypad = AsyncKeypad(KEYPAD_LAYOUT, KEYPAD_ROW_PINS, KEYPAD_COL_PINS)

    try:
        while True:
            key = await keypad.get_key()
            print("Key Pressed:", key)
    finally:
        keypad.close()


if __name__ == "__main__":
    asyncio.run(main())
