# USAGE
When setting up the server on the CSL VM (cs506x19.cs.wisc.edu), clone this repository into /nobackup/T_19. Otherwise, permission issues will prevent the docker containers from starting up correctly.
To start up containers and database, use provided bash script.
- ./compose_manager.sh startup
    - Build and start containers. The database and backend server are now running.
- ./compose_manager.sh shutdown
    - Stop and delete database container, delete database persistent storage
    - Stop backend container
    - Used to completely reset the state of all backend servers (reload new schema)
- ./compose_manager.sh down
    - Stop both mysql and js containers, can be started again with startup with no loss of information
- ./compose_manager.sh reloadBackend
    - Used when developing backend server, will stop and restart backend container to load new code changes