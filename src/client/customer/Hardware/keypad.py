import asyncio
from typing import NoReturn

import lgpio


class AsyncKeypad:
    """Keypad class for getting user input from matrix keypad."""

    def __init__(
        self,
        keypad: list[list[str]],
        row_pins: list[int],
        col_pins: list[int],
        chip: int = 0,
        scan_delay: float = 0.05,
    ) -> None:
        self.keypad = keypad
        self.row_pins = row_pins
        self.col_pins = col_pins
        self.chip = chip
        self.scan_delay = scan_delay
        self.queue = asyncio.Queue()

        # open GPIO chip
        self.handle = lgpio.gpiochip_open(chip)

        for pin in self.row_pins:
            # all row pins need pull up resitor with 3.3 V
            lgpio.gpio_claim_input(self.handle, pin)

        # Cols
        for pin in self.col_pins:
            lgpio.gpio_claim_output(self.handle, pin, 1)

        self._task = None

    async def start(self) -> None:
        self._task = asyncio.create_task(self._scan_loop())

    async def get_key(self) -> str:
        return await self.queue.get()

    async def _scan_loop(self) -> NoReturn:
        while True:
            for col_idx, col_pin in enumerate(self.col_pins):
                lgpio.gpio_write(self.handle, col_pin, 0)

                for row_idx, row_pin in enumerate(self.row_pins):
                    if lgpio.gpio_read(self.handle, row_pin) == 0:
                        key = self.keypad[row_idx][col_idx]
                        await self.queue.put(key)

                        # Wait for key release
                        while lgpio.gpio_read(self.handle, row_pin) == 0:  # noqa: ASYNC110
                            await asyncio.sleep(0.01)

                lgpio.gpio_write(self.handle, col_pin, 1)

            await asyncio.sleep(self.scan_delay)

    async def close(self) -> None:
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

        if self.handle is not None:
            try:
                lgpio.gpiochip_close(self.handle)
            except lgpio.error as e:
                print(f"Warning: Tried to close GPIO handle that may already be closed: {e}")
            self.handle = None
