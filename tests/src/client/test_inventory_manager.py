import pytest

import src.client.exceptions as err
from src.client.enum_types import InventoryManagerMode
from src.client.inventory_manager import InventoryManager


@pytest.fixture
def inventory_manager() -> InventoryManager:
    """Inventory Manager for Testing. Using 3 by 3 size for layout."""
    return InventoryManager(height=3, width=3)


def test_initialization() -> None:
    """Tests creation of a new InventoryManager instance."""
    inv_manager = InventoryManager(3, 3)
    # test getting mode to make sure creation is valid
    assert inv_manager.get_mode() == InventoryManagerMode.IDLE

    # test creation with invalid dimensions (not large enough)
    with pytest.raises(err.InvalidDimensionsError):
        InventoryManager(0, 5)

    # test creation with invalid dimensions (too large dimension)
    with pytest.raises(err.InvalidDimensionsError):
        InventoryManager(11, 5)


def test_get_mode(inventory_manager: InventoryManager) -> None:
    """Tests getting the state of the inventory manager.

    Parameters
    ----------
        inventory_manager: Pytest fixture of InventoryManager object.

    """
    # Default mode for inventory manager test
    assert inventory_manager.get_mode() == InventoryManagerMode.IDLE


def test_set_mode(inventory_manager: InventoryManager) -> None:
    """Tests setting the mode for invenetory manager and that illegal mode switching rasises exceptions.

    Parameters
    ----------
        inventory_manager: Pytest fixture of InventoryManager object.

    """
    # Idle to restocking test
    inventory_manager.set_mode(InventoryManagerMode.RESTOCKING)
    assert inventory_manager.get_mode() == InventoryManagerMode.RESTOCKING

    # Restocking to Idle test
    inventory_manager.set_mode(InventoryManagerMode.IDLE)
    assert inventory_manager.get_mode() == InventoryManagerMode.IDLE

    # Idle to Idle test
    with pytest.raises(err.InvalidModeError):
        inventory_manager.set_mode(InventoryManagerMode.IDLE)

    # Idle to transcation test
    inventory_manager.set_mode(InventoryManagerMode.TRANSACTION)
    assert inventory_manager.get_mode() == InventoryManagerMode.TRANSACTION

    # Transactionl to restocking test
    with pytest.raises(err.InvalidModeError):
        inventory_manager.set_mode(InventoryManagerMode.RESTOCKING)


def test_get_stock_information(inventory_manager: InventoryManager) -> None:
    """Tests getting stock information as a string output.

    Parameters
    ----------
        inventory_manager: Pytest fixture of InventoryManager object.

    """
    # Add item to inventory manager
    inventory_manager.add_item("00", "Soda", 10, 1.5)

    # get_stock_information returns a string with item details in the format: "slot_id: item_name, Price: price, Left in Stock: stock"
    stock_info = inventory_manager.get_stock_information()
    assert "00: Soda, Price: 1.5, Left in Stock: 10" in stock_info


def test_change_stock(inventory_manager: InventoryManager) -> None:
    """Tests changing stock and that illegal updates raise an error.

    Parameters
    ----------
        inventory_manager: Pytest fixture of InventoryManager object.

    """
    # Add item to inventory manager and
    inventory_manager.add_item("00", "Soda", 10, 1.5)

    # change stock returns (-1 * item_stock * item.get_cost()) when stock is changed
    result = inventory_manager.change_stock("00", -2)

    # make sure inventory mangager updates stock correctly
    assert result == 3.0

    # Illegal stock update raises an error
    with pytest.raises(err.EmptySlotError):
        inventory_manager.change_stock("01", 5)


def test_add_item(inventory_manager: InventoryManager) -> None:
    """Tests that adding an item to the inventory works.

    Parameters
    ----------
        inventory_manager: Pytest fixture of InventoryManager object.

    """
    # Check that item exists in manager once it is added
    inventory_manager.add_item("00", "Soda", 10, 1.5)

    # Take added item from slot location in vending machine
    item = inventory_manager.get_item("00")

    # make sure item is the exact item added
    assert item.get_name() == "Soda"
    assert item.get_cost() == 1.5
    assert item.get_stock() == 10


def test_clear_slot(inventory_manager: InventoryManager) -> None:
    """Test clearing slot and that removing empty slot throws an error.

    Parameters
    ----------
        inventory_manager: Pytest fixture of InventoryManager object.

    """
    # Add item to inventory manager
    inventory_manager.add_item("00", "Soda", 10, 1.5)

    # Clear slot of added item and make sure that it throws an Empty slotError when trying to
    # access again
    inventory_manager.clear_slot("00")
    with pytest.raises(err.EmptySlotError):
        inventory_manager.get_item("00")


def test_set_cost(inventory_manager: InventoryManager) -> None:
    """Test updating the cost to a slot and that setting a cost for an empty slot is an error.

    Parameters
    ----------
        inventory_manager: Pytest fixture of InventoryManager object.

    """
    inventory_manager.add_item("00", "Soda", 10, 1.5)
    # set new cost
    inventory_manager.set_cost("00", 2.0)
    item = inventory_manager.get_item("00")
    # Make sure new cost is reflected for the item
    assert item.get_cost() == 2.0

    # Make sure updating cost of non-existing item raises EmptySlotError
    with pytest.raises(err.EmptySlotError):
        inventory_manager.set_cost("01", 2.0)


def test_get_item(inventory_manager: InventoryManager) -> None:
    """Test getting item from valid and empty slot.

    Parameters
    ----------
        inventory_manager: Pytest fixture of InventoryManager object.

    """
    inventory_manager.add_item("00", "Soda", 10, 1.5)
    # Get item from valid slot and make sure it returns the correct item
    item = inventory_manager.get_item("00")
    assert item.get_name() == "Soda"
    # raise error when accessing empty slot
    with pytest.raises(err.EmptySlotError):
        inventory_manager.get_item("01")


# Private Tests
def test_get_coordinates_from_slotname(inventory_manager: InventoryManager) -> None:
    """Test private function for getting coordinates for an item for valid and invalid cases.

    Parameters
    ----------
        inventory_manager: Pytest fixture of InventoryManager object.

    """
    assert inventory_manager._InventoryManager__get_coordinates_from_slotname("00") == (0, 0)

    with pytest.raises(err.InvalidSlotNameError):
        inventory_manager._InventoryManager__get_coordinates_from_slotname("A1")

    with pytest.raises(err.InvalidSlotNameError):
        inventory_manager._InventoryManager__get_coordinates_from_slotname("000")
