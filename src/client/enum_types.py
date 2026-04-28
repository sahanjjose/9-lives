from enum import Enum


class InventoryManagerMode(Enum):  # noqa: D101
    IDLE = 1
    TRANSACTION = 2
    RESTOCKING = 3
