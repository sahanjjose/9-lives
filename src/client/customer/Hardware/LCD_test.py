import asyncio

from hardware_constants import (
    I2C_ADDR,
    LCD_BACKLIGHT,
    LCD_CHR,
    LCD_CMD,
    LCD_E_DELAY,
    LCD_E_PULSE,
    LCD_ENABLE,
    LCD_LINE_1,
    LCD_LINE_2,
    LCD_WIDTH,
)
from LCD_display import LCDDisplay


async def main() -> None:
    lcd = LCDDisplay(
        I2C_ADDR,
        LCD_WIDTH,
        LCD_LINE_1,
        LCD_LINE_2,
        LCD_CHR,
        LCD_CMD,
        LCD_BACKLIGHT,
        LCD_ENABLE,
        LCD_E_PULSE,
        LCD_E_DELAY,
    )

    await lcd.init()
    await lcd.write("Test Message", lcd.LCD_LINE_1)
    await lcd.write("This is a test of a very long message", lcd.LCD_LINE_2)
    await asyncio.sleep(5)
    await lcd.clear_line(lcd.LCD_LINE_1)
    await lcd.clear_line(lcd.LCD_LINE_2)


if __name__ == "__main__":
    asyncio.run(main())
