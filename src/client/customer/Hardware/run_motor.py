import asyncio
from typing import NoReturn

from gpiozero import Button
from hardware_constants import (
    BUTTON_1_PIN,
    STEP_DELAY,
    STEP_SEQUENCE,
    STEPPER_1_PINS,
    STEPS_PER_QUARTER_REV,
)
from stepper_motors import StepperMotor

stepper_motor = StepperMotor(STEPS_PER_QUARTER_REV, STEP_DELAY, STEP_SEQUENCE, STEPPER_1_PINS)


button = Button(BUTTON_1_PIN, pull_up=True, bounce_time=0.05)


async def monitor_button() -> NoReturn:
    while True:
        if button.is_pressed:
            if not stepper_motor.moving:
                await stepper_motor.rotate_motor(4)
            await asyncio.sleep(0.2)  # debounce delay
        await asyncio.sleep(0.01)  # polling rate


async def print_background() -> NoReturn:
    while True:
        print("System idle — waiting for button press... (Testing running other functions)")
        await asyncio.sleep(1)


async def main() -> None:
    await asyncio.gather(
        monitor_button(),
        print_background(),
    )


asyncio.run(main())
