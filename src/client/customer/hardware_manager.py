from customer.Hardware.keypad import AsyncKeypad
from customer.Hardware.LCD_display import LCDDisplay
from customer.Hardware.stepper_motors import StepperMotor


class InputManager:
    """Handles UI input from keypad."""

    def __init__(self, layout: list[list[str]], rows: int, cols: int) -> None:
        self.keypad = AsyncKeypad(layout, rows, cols)

    async def start(self) -> None:
        await self.keypad.start()

    async def get_key(self) -> str:
        return await self.keypad.get_key()

    async def close(self) -> None:
        await self.keypad.close()


class DispenserManager:
    """Handles running motors for item dispensing."""

    def __init__(self, motor_grid: list[list[StepperMotor]]) -> None:
        self.motors = motor_grid

    async def dispense(self, row: int, col: int) -> None:
        motor = self.motors[row][col]
        print(motor.pins)
        await motor.rotate_motor(4)


class DisplayManager:
    """Handles displaying text on LCD display."""

    def __init__(self, lcd_config: dict) -> None:
        self.lcd = LCDDisplay(**lcd_config)

    async def start(self) -> None:
        await self.lcd.init()

    async def show_text(self, text: str, line: int) -> None:
        await self.lcd.clear_line(line)
        await self.lcd.write(text, line=line)

    async def clear_text(self, line: int) -> None:
        await self.lcd.clear_line(line)
