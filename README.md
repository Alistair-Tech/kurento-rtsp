# kurento-rtsp

## Description
The web application obtains RTSP streams through dynamic user input and displays them on the main web page using WebRTC. Multiple streams can be played at a time along with functionality for starting and stopping the streams. 
The web application has been implemented in Node JS.

## Software Dependencies
The application requires the Kurento Media Server to be installed and deployed on device running the application. Installation Guide:[Kurento Installation Guide](https://doc-kurento.readthedocs.io/en/6.14.0/user/installation.html#) 
The server is expected to run by default on localhost:8888 (the default in Kurento). An alternate port can also be used but it needs to specified through command line arguments (ws_uri) when running the application.

## Installation and Set-Up
1. Clone the repo to your machine
2. Install the npm dependencies using 
    ```bash
    npm install
    ```
3. For testing purposes, you can simply generate a self-signed certificate using an openssl generated RSA key. A suitable resource for this purpose (any alternate method also works) is https://medium.com/@nitinpatel_20236/how-to-create-an-https-server-on-localhost-using-express-366435d61f28
This step is important since Kurento needs an https URL to function.

4. Name the key ```key.pem``` and name the certificate ```cert.pem``` and keep them in the project root directory.

5. Run the application with:
    ```bash
    npm start
    ```

## Additional Note
This is experimental code and needs added functionality for session handling as well STUN/TURN configuration in the Kurento Media Server before it can be used in production. For the latter, Kurento documentation is easy to understand:- [STUN/TURN](https://doc-kurento.readthedocs.io/en/6.14.0/user/installation.html#stun-turn-server-install)
