import pytest  # noqa: N999

from src.client import exceptions as err
from src.client.item import Item


# Fixture to create a sample Item instance
@pytest.fixture
def sample_item() -> Item:
    return Item("Soda", 1.50, 10)


# Test the constructor and attribute validation
def test_item_initialization() -> None:
    item = Item("Chips", 2.00, 5)
    assert item.get_name() == "Chips"
    assert item.get_cost() == 2.00  # noqa: PLR2004
    assert item.get_stock() == 5  # noqa: PLR2004

    with pytest.raises(err.NegativeCostError, match="Cost of item must be >= 0"):
        Item("Candy", -1, 5)

    with pytest.raises(err.NegativeStockError, match="Value of must be >= 0"):
        Item("Gum", 1.00, -1)


# Test get_name method
def test_get_name(sample_item) -> None:  # noqa: ANN001
    assert sample_item.get_name() == "Soda"


# Test get_cost method
def test_get_cost(sample_item) -> None:  # noqa: ANN001
    assert sample_item.get_cost() == 1.50  # noqa: PLR2004


# Test get_stock method
def test_get_stock(sample_item) -> None:  # noqa: ANN001
    assert sample_item.get_stock() == 10  # noqa: PLR2004


# Test set_cost method
def test_set_cost(sample_item) -> None:  # noqa: ANN001
    sample_item.set_cost(2.00)
    assert sample_item.get_cost() == 2.00  # noqa: PLR2004

    with pytest.raises(err.NegativeCostError, match="Cost of item must be >= 0"):
        sample_item.set_cost(-1.12131)


# Test adjust_stock method
def test_adjust_stock(sample_item) -> None:  # noqa: ANN001
    sample_item.adjust_stock(5)
    assert sample_item.get_stock() == 15  # noqa: PLR2004

    sample_item.adjust_stock(-5)
    assert sample_item.get_stock() == 10  # noqa: PLR2004

    with pytest.raises(err.NegativeStockError, match="Value of stock cannot go below 0"):
        sample_item.adjust_stock(-11)
