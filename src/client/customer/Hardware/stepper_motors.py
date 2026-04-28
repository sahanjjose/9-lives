import asyncio

from gpiozero import OutputDevice


class StepperMotor:
    """Stepper motor object to control stepper motor with raspberry pi GPIO pins."""

    def __init__(
        self,
        steps_per_rev: int,
        step_delay: float,
        step_sequence: list[list[int]],
        pins: list[int],
    ) -> None:
        """Intializes stepper motor object."""
        # error checks

        # object attributes
        self.steps_per_rev = steps_per_rev
        self.step_delay = step_delay
        self.step_sequence = step_sequence
        self.pins = pins
        self.moving = False

    async def rotate_motor(self, my_quarter_rotations: int) -> None:
        """Rotates motor clockwise with quarter rotation precision.
        When calling use asyncio.run(StepperMotor.rotate_motor(int)).
        """  # noqa: D205
        # error check
        if not isinstance(my_quarter_rotations, int):
            raise TypeError(
                "Oh no!!, my_quarter_rotations is not of type int,"
                f"and is {type(my_quarter_rotations)}, value passed: {my_quarter_rotations}",
            )

        # compute total steps for wanted amount of rotation
        total_steps = my_quarter_rotations * self.steps_per_rev
        # coils from gpiozero library for driver
        coils = [OutputDevice(pin) for pin in self.pins]

        # cycle through number of steps
        # try statement used to make sure coils turn off in case of error
        self.moving = True
        try:
            for step_num in range(total_steps):
                step = self.step_sequence[step_num % len(self.step_sequence)]
                for coil, val in zip(coils, step):
                    coil.value = val
                await asyncio.sleep(self.step_delay)
            await asyncio.sleep(self.step_delay)
        finally:
            [coil.off() for coil in coils]
            self.moving = False
