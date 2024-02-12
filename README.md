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

### Frontend

- Navigate to the `frontend` directory.
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