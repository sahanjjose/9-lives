###################
# Stepper Motors  #
###################


STEPS_PER_QUARTER_REV = 1024
"""Discrete number of steps that motor will take when completeing one quarter rotation."""

STEP_DELAY = 0.002
"""Number of seconds between steps."""

STEP_SEQUENCE = [
    [1, 0, 0, 0],
    [1, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 1, 0],
    [0, 0, 1, 1],
    [0, 0, 0, 1],
    [1, 0, 0, 1],
]
"""
Step sequence for 28BYJ-48 stepper motor. Each row repersents the 4 inputs on the ULN2003
stepper driver, In1, In2, In3, In4 respectivity. The patterns energerizes the stepper motors
individual coils in the correct sequence.
"""

"""GPIO pins used on the pi to map to the inputs of the stepper motors."""
STEPPER_PINS = [
    [   # Row 1
        [17, 18, 27, 22],   # Motor 1
        [14, 15, 16, 20],   # Motor 2
        [21, 25, 7, 8],     # Motor 3
    ],
]

###################
##### Buttons  ####
###################

BUTTON_1_PIN = 23
"""GPIO pin that the button is connected to on the raspberry pi."""

###################
### LCD Display  ##
###################

# Device settings
I2C_ADDR = 0x27
"""I2C device address"""
LCD_WIDTH = 16
"""Maximum characters per line for LCD display."""

LCD_CHR = 1
"""LCD character mode for sending data."""

LCD_CMD = 0
"""LCD mode for sending commands."""

LCD_LINE_1 = 0x80
"""RAM address for 1st line of LCD."""

LCD_LINE_2 = 0xC0
"""RAM address for 2nd line of LCD."""

LCD_BACKLIGHT = 0x08
"""ON for LCD backlight."""

LCD_ENABLE = 0b00000100
"""Enable string for LCD."""

# Device timings
LCD_E_PULSE = 0.0005
"""Enable timing for flip flop to be enabled to store updated characters."""

LCD_E_DELAY = 0.0005
"""Delay before and after for enabling flip flops for characters."""


###################
##### Keypad  #####
###################

KEYPAD_LAYOUT = [
    ["1", "2", "3", "A"],
    ["4", "5", "6", "B"],
    ["7", "8", "9", "C"],
    ["*", "0", "#", "D"],
]
"""4x4 matrix keypad layout with button relating button positions."""

KEYPAD_ROW_PINS = [5, 6, 13, 19]
"""Pins associated with the rows of the keypad."""

KEYPAD_COL_PINS = [4, 12, 26, 24]
"""Pins associated with the cols of the keypad."""


###################
#######  UI  ######
###################

DISPENSE_KEY = "*"
"""Key to intiate dispensing of item."""

DELETE_KEY = "D"
"""Deltes last user inputted key."""

CARD_INFO_KEY = "C"
"""Simulates entering card info."""

END_TRANSACTION_KEY = "B"
"""Ends an existing transaction"""
