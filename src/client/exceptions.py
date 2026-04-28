class EmptySlotError(Exception):
    """Thrown when a function attempts to access a slot that is empty expecting an item."""
    pass


class NegativeStockError(Exception):
    """Thrown when a function attempts to modify an item's stock to go below 0."""
    pass


class NegativeCostError(Exception):
    """Thrown when a function attempts to set the cost of an item to a value below 0"""
    pass


class InvalidModeError(Exception):
    """Thrown when a function attempts to perform an operation when in the incorrect mode."""
    pass


class InvalidDimensionsError(Exception):
    """Thrown when an inventory_manager is instantiated with invalid dimensions"""
    pass


class InvalidSlotNameError(Exception):
    """Thrown when trying to access a nonexistent slot"""
    pass

class InvalidHardwareIDError(Exception):
    """Thrown when vending machine instantiated with inventory_manager with mismatched hardware_id"""
    pass

class QueryFailureError(Exception):
    """Thrown when query fails or returns invalid results."""

    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code

    def __str__(self):
        return self.message + "; Status code: " + str(self.status_code)

class NotFreeItemError(Exception):
    """Thrown when tring to dispense free item that is not free."""
    pass