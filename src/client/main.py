import asyncio

from customer.Hardware.hardware_constants import (
    I2C_ADDR,
    KEYPAD_COL_PINS,
    KEYPAD_LAYOUT,
    KEYPAD_ROW_PINS,
    LCD_BACKLIGHT,
    LCD_CHR,
    LCD_CMD,
    LCD_E_DELAY,
    LCD_E_PULSE,
    LCD_ENABLE,
    LCD_LINE_1,
    LCD_LINE_2,
    LCD_WIDTH,
    STEP_DELAY,
    STEP_SEQUENCE,
    STEPPER_PINS,
    STEPS_PER_QUARTER_REV,
)
from customer.Hardware.stepper_motors import StepperMotor
from customer.hardware_manager import DispenserManager, DisplayManager, InputManager
from vm_runner import VendingMachineRunner

if __name__ == "__main__":
    input_mgr = InputManager(KEYPAD_LAYOUT, KEYPAD_ROW_PINS, KEYPAD_COL_PINS)
    display_mgr = DisplayManager(
        {
            "i2c_addr": I2C_ADDR,
            "width": LCD_WIDTH,
            "line_1": LCD_LINE_1,
            "line_2": LCD_LINE_2,
            "lcd_chr": LCD_CHR,
            "lcd_cmd": LCD_CMD,
            "backlight": LCD_BACKLIGHT,
            "enable_flag": LCD_ENABLE,
            "e_pulse": LCD_E_PULSE,
            "e_delay": LCD_E_DELAY,
        },
    )

    motors = [
        [StepperMotor(STEPS_PER_QUARTER_REV, STEP_DELAY, STEP_SEQUENCE, pins) for pins in row]
        for row in STEPPER_PINS
    ]

    dispenser_mgr = DispenserManager(motors)

    config_file = "customer/configuration.json"

    vm_hw = VendingMachineRunner(input_mgr, display_mgr, dispenser_mgr, config_file)
    asyncio.run(vm_hw.run())
