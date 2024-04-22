# Collaboration-Board

Developed by Matthew Merritt and Michael Merritt for CSC575.

## Installation / Setup

Assumes that you have Node installed.
Also assumes ports 8080 and 3000 are free on localhost.

### Backend

- Navigate to the `backend` directory.
- Run the following:
```
npm install
```

- Once package install is completed, run the following:
```
npm run start
```

- Complete the following database setup.
    - Install MongoDB Community Edition from [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
        - Confirmed working with v7.0.8 for Windows x86-64
    - Launch MongoDBCompass, connect to a new database, create a new database called `board`, and add collections called `cards` and `columns` to the board database.

    **OLD**
    - Install PostgreSQL from [https://www.enterprisedb.com/downloads/postgres-postgresql-downloads](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)
        - Confirmed working with v16.2 for Windows x86-64.
        - Save the password for the `postgres` superuser, as this will be needed for the backend later.
        - Also save the port used for the database.

    - For Windows, ensure that the command `psql` can be run from the command line.
        - If not, it is possible that you need to update your PATH.
        - Assuming the default installation, add the following to your PATH:
        ```
        C:\Program Files\PostgreSQL\16\bin
        ```
        - Once added to path, you may need to restart your machine to get changes to take effect.

    - To view the database, run the following:
    ```
    psql --username=postgres
    ```
    **END OF OLD**

- Create `.env` file using sample as a basis.
    - For the default install of PostgreSQL, it will look like the following:
    ```
    # postgres database connection information
    DB_USER='postgres'
    DB_HOST='::1'
    DB_DATABASE='postgres'
    DB_PASSWORD='<REMOVED>'
    DB_PORT=5432

    # mongo connection information
    DB_CONNECTION_STRING='<REMOVED>'
    ```

### Frontend

- Navigate to the `frontend` directory.
- Run the following:
```
npm install
```
- Ensure that the backend is already running. 
    - We are not currently sure why, but building requires the ability to connect to the WebSocketServer.
- Run the following:
```
npm run build
```
- Once build is completed, run the following:
```
npm run start
```
- Visit `localhost:3000`.