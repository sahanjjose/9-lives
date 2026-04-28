from __future__ import annotations

import time
from functools import wraps

import requests
from api_constants import (
    BACKEND_HOST,
    SUCCESS,
)


# Repeatedly pings health endpoint of api until valid response is received
def ping_endpoint():
    print("Connecting...")
    while(True):
        try:
            response = requests.get(BACKEND_HOST + "/health", timeout=5)
            if response.status_code == SUCCESS:
                print("Connection success!")
                return
            print("Connection failed: retrying...")
        except requests.exceptions.RequestException:
            pass
        time.sleep(5)


# Decorator for all endpoint calling functions that tries to call the endpoint
# If the initial call fails, we ping the api till reconnection, then call it again
def ping_endpoint_till_connect():
    def decorator(func):  # noqa: ANN001, ANN202
        @wraps(func)
        def wrapper(*args, **kwargs):  # noqa: ANN003, ANN202
            while True:
                try:
                    return func(*args, **kwargs)
                except (ConnectionError, TimeoutError):  # noqa: PERF203
                    print("Lost connection. Waiting for API to recover...")
                    ping_endpoint()
                    print("Retrying request...")
                    # Loop will re-call func after API is back
        return wrapper
    return decorator
