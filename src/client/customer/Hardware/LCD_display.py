import asyncio

from smbus2 import SMBus


class LCDDisplay:
    """LCD display class to encapsulate control of displaying characters to a LCD display with an I2C module."""

    def __init__(  # noqa: PLR0913
        self,
        i2c_addr: int,
        width: int,
        line_1: int,
        line_2: int,
        lcd_chr: int,
        lcd_cmd: int,
        backlight: int,
        enable_flag: int,
        e_pulse: float,
        e_delay: float,
    ) -> None:
        """Creates LCD object.

        Parameters
        ----------
            i2c_addr (int): I2C device address
            width (int): Maximum characters per line for LCD display
            line_1 (int): RAM address for 1st line of LCD
            line_2 (int): RAM address for 2nd line of LCD
            lcd_chr (int): LCD character mode for sending data
            lcd_cmd (int): LCD mode for sending commands
            backlight (int): ON for LCD backlight
            enable_flag (int): Enable string for LCD
            e_pulse (float): Enable timing for flip flop to be enabled to store updated characters
            e_delay (float): Delay before and after for enabling flip flops for characters

        """
        # Device constants
        self.I2C_ADDR = i2c_addr
        self.LCD_WIDTH = width
        self.LCD_LINE_1 = line_1
        self.LCD_LINE_2 = line_2
        self.LCD_CHR = lcd_chr
        self.LCD_CMD = lcd_cmd
        self.LCD_BACKLIGHT = backlight
        self.LCD_ENABLE = enable_flag
        self.E_PULSE = e_pulse
        self.E_DELAY = e_delay

        # Track scrolling routines per line
        self._scrolling_tasks = {}

        # I2C bus setup
        self.bus = SMBus(1)

    async def init(self):
        await self._lcd_byte(0x33, self.LCD_CMD)  # Init
        await self._lcd_byte(0x32, self.LCD_CMD)  # Init
        # Cursor move direction
        await self._lcd_byte(0x06, self.LCD_CMD)
        # Display On, Cursor Off
        await self._lcd_byte(0x0C, self.LCD_CMD)
        # 2 line display
        await self._lcd_byte(0x28, self.LCD_CMD)
        # Clear display
        await self._lcd_byte(0x01, self.LCD_CMD)
        await asyncio.sleep(self.E_DELAY)

    async def write(self, message: str, line: int, scroll_delay: float = 0.3) -> None:
        """Write a message to the LCD. If it's too long, scroll it indefinitely until cleared."""
        # First, ensure any existing scrolling task for this line is properly canceled
        if line in self._scrolling_tasks:
            self._scrolling_tasks[line].cancel()
            try:  # noqa: SIM105
                await self._scrolling_tasks[line]
            except asyncio.CancelledError:
                pass
            del self._scrolling_tasks[line]

            # Clean the line before writing new content
            await self._lcd_byte(line, self.LCD_CMD)
            for _ in range(self.LCD_WIDTH):
                await self._lcd_byte(ord(" "), self.LCD_CHR)

            # Small delay to ensure I2C bus stability
            await asyncio.sleep(0.01)

        await self.clear_line(line=line)

        # Now write the new message
        if len(message) <= self.LCD_WIDTH:
            await self._lcd_byte(line, self.LCD_CMD)
            message = message.ljust(self.LCD_WIDTH, " ")
            for char in message:
                await self._lcd_byte(ord(char), self.LCD_CHR)
        else:
            # Launch a new task to scroll indefinitely
            await self._lcd_byte(line, self.LCD_CMD)  # Reset cursor position
            task = asyncio.create_task(self._scroll_loop(message, line, scroll_delay))
            self._scrolling_tasks[line] = task

    async def _scroll_loop(self, message: str, line: int, scroll_delay: float) -> None:
        scroll_text = message + " " * self.LCD_WIDTH
        try:
            while True:
                for i in range(len(scroll_text) - self.LCD_WIDTH + 1):
                    window = scroll_text[i : i + self.LCD_WIDTH]
                    await self._lcd_byte(line, self.LCD_CMD)
                    for char in window:
                        await self._lcd_byte(ord(char), self.LCD_CHR)
                    await asyncio.sleep(scroll_delay)
        except asyncio.CancelledError:
            # Clear the line when canceled to avoid partial text
            try:
                await self._lcd_byte(line, self.LCD_CMD)
                for _ in range(self.LCD_WIDTH):
                    await self._lcd_byte(ord(" "), self.LCD_CHR)
            except Exception:
                # Ignore any errors during cleanup
                pass
            raise  # Re-raise to properly handle task cancellation

    async def clear_line(self, line: int) -> None:
        """Clear a specific line and cancel any scrolling task on it."""
        if line in self._scrolling_tasks:
            self._scrolling_tasks[line].cancel()
            try:  # noqa: SIM105
                await self._scrolling_tasks[line]
            except asyncio.CancelledError:
                pass
            del self._scrolling_tasks[line]

        await self._lcd_byte(line, self.LCD_CMD)
        for _ in range(self.LCD_WIDTH):
            await self._lcd_byte(ord(" "), self.LCD_CHR)
            await asyncio.sleep(0.005)  # delay for I2C stability

    async def clear_all(self):
        await self.clear_line(self.LCD_LINE_1)
        await self.clear_line(self.LCD_LINE_2)

    async def _lcd_byte(self, bits: int, mode: int) -> None:
        bits_high = mode | (bits & 0xF0) | self.LCD_BACKLIGHT
        bits_low = mode | ((bits << 4) & 0xF0) | self.LCD_BACKLIGHT

        self.bus.write_byte(self.I2C_ADDR, bits_high)
        await self._toggle_enable(bits_high)

        self.bus.write_byte(self.I2C_ADDR, bits_low)
        await self._toggle_enable(bits_low)

    async def _toggle_enable(self, bits: int) -> None:
        await asyncio.sleep(self.E_DELAY)
        self.bus.write_byte(self.I2C_ADDR, (bits | self.LCD_ENABLE))
        await asyncio.sleep(self.E_PULSE)
        self.bus.write_byte(self.I2C_ADDR, (bits & ~self.LCD_ENABLE))
        await asyncio.sleep(self.E_DELAY)
