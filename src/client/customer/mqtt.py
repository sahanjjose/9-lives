
import threading

import paho.mqtt.client as mqtt
from api_constants import BROKER_HOST
from inventory_manager import InventoryManager


class MQTTConnection:
    """Message queueing service that serves automatic restocking and healthcheckups.

    Methods
    -------
    start_mqtt_connection(hardware_id: str, inv_man: InventoryManager)
        Sets a persistent will ("offline") in status topic for this machine before init
        Sets the status persistently to "online" on init
        Connects to broker, subscribes to restocking updates topic
        If restock message comes through, sync local info with database

    """

    @staticmethod
    def start_mqtt_connection(hardware_id: str, inv_man: InventoryManager) -> None:

        def on_message(client, userdata, message) -> None:  # noqa: ANN001, ARG001
            print("Restocked, syncing from database:")
            inv_man.sync_from_database()

        # No need to retain previous messages, inventory is loaded from db on init anyways
        client = mqtt.Client(client_id=hardware_id, clean_session=False)
        client.on_message = on_message

        # Set up Last Will and Testament as a retained message
        status_topic = f"vm/status/{hardware_id}"
        client.will_set(status_topic, "offline", qos=1, retain=True)

        # Connect with 60 second keepalive (pings broker once every 60 seconds as heartbeat)
        client.connect(BROKER_HOST, 3306, 60)

        # Publish online status as a retained message
        client.on_connect = lambda client, u, f, rc: client.publish(  # noqa: ARG005
            status_topic, "online", qos=1, retain=True,
        )

        client.subscribe(f"vm/restocked/{hardware_id}", qos=1)

        mqtt_thread = threading.Thread(target=client.loop_forever)
        mqtt_thread.daemon = True  # Make thread exit when main program exits
        mqtt_thread.start()
