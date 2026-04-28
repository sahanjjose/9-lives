BACKEND_HOST = "http://cs506x19.cs.wisc.edu:8080" #cs CLI machine hosting the DB
# BACKEND_HOST = "http://localhost:8080" #For local testing
BROKER_HOST = "cs506x19.cs.wisc.edu"
# BROKER_HOST = "localhost"
MACHINES_ROUTE = "vending-machines" #API route for the related class
INVENTORY_ROUTE = "inventory"
ITEMS_ROUTE = "items"#API route for items
REQUEST_HEADERS = {'Content-Type':'application/json'} #header for api post

SUCCESS = 200
BAD_REQUEST = 400
NOT_FOUND = 404
INTERNAL_SERVER_ERROR = 500
TIMEOUT = 10
