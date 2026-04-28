import exceptions as err  # noqa: INP001


class Item:
    """A item in the vending machine.

    Attributes
    ----------
    item_name : str
        The name of the item.
    cost : float
        The cost of the item (in dollars)
    stock : int
        The number of the item currently in stock

    Methods
    -------
    def get_name(self) -> str
        Get the name of the item.
    def get_cost(self) -> float
        Get the cost of the item.
    def get_stock(self) -> int
        Get the stock of the item
    def set_cost(self, cost) -> None
        Set the cost of the item
    def adjust_stock(self, adjustment_amount) -> None
        Update the stock of the item (can be positive or negative value)

    """

    def __init__(self, item_name: str, cost: float, stock: int = 0) -> None:
        """Initialize an item with a name, cost and initial stock."""
        """Cost must be greater than 0 and stock must be at least 0."""
        self.__item_name = item_name

        if cost < 0:
            raise err.NegativeCostError("Cost of item must be >= 0")
        if stock < 0:
            raise err.NegativeStockError("Value of must be >= 0")

        self.__cost = round(cost, 2)
        self.__stock = stock

    def get_name(self) -> str:
        return self.__item_name

    def get_cost(self) -> float:
        return self.__cost

    def get_stock(self) -> int:
        return self.__stock

    def set_cost(self, cost: float) -> None:
        if cost < 0:
            raise err.NegativeCostError("Cost of item must be >= 0")
        self.__cost = round(cost, 2)

    def adjust_stock(self, adjustment_amount: int) -> None:
        if self.__stock + adjustment_amount < 0:
            raise err.NegativeStockError("Value of stock cannot go below 0")
        self.__stock += adjustment_amount
